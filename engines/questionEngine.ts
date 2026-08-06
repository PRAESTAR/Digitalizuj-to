import type { Question, QuizDefinition, Answer } from '@/types';
import questionBankData from '@/data/questionBank.json';

const questionBank = questionBankData as {
  version: string;
  indicative_quiz: QuizDefinition;
  complex_quiz: { modules: { questions: Question[] }[] } & QuizDefinition;
};

/**
 * Get all questions for a quiz type, flattened from modules if needed.
 */
export function getQuizQuestions(type: 'indicative' | 'complex'): Question[] {
  if (type === 'indicative') {
    return (questionBank.indicative_quiz.questions || []) as Question[];
  }
  const modules = questionBank.complex_quiz.modules || [];
  return modules.flatMap(m => m.questions as Question[]);
}

/**
 * Get the quiz definition (name, description).
 */
export function getQuizDefinition(type: 'indicative' | 'complex'): QuizDefinition {
  return type === 'indicative'
    ? questionBank.indicative_quiz
    : questionBank.complex_quiz;
}

/**
 * Get the next unanswered, non-skipped question.
 */
export function getNextQuestion(
  questions: Question[],
  answers: Answer[],
  skippedIds: Set<string>
): Question | null {
  const answeredIds = new Set(answers.map(a => a.questionId));

  for (const q of questions) {
    if (!answeredIds.has(q.id) && !skippedIds.has(q.id)) {
      return q;
    }
  }
  return null;
}

/**
 * Get current progress.
 */
export function getProgress(
  questions: Question[],
  answers: Answer[],
  skippedIds: Set<string>
): { current: number; total: number; percentage: number } {
  const answerable = questions.filter(q => !skippedIds.has(q.id));
  // Preskočené otázky sa od 5. 8. 2026 materializujú ako syntetické odpovede
  // (aby sa dalo odlíšiť „Neviem" od „nepoložené"), takže sa do počítadla
  // nesmú rátať — inak by ukazovateľ skákal dopredu pri každom vetvení.
  const answered = answers.filter(a => !a.wasSkipped).length;
  const total = answerable.length;
  return {
    current: answered,
    total,
    percentage: total > 0 ? Math.round((answered / total) * 100) : 0,
  };
}

/**
 * Evaluate branching rules for a question after it's answered.
 * Returns: { skip: string[], include: string[], riskFlags: string[] }
 */
export function evaluateBranching(
  question: Question,
  answer: Answer
): { skip: { target: string; reason: string }[]; include: string[]; riskFlags: string[] } {
  const result = {
    skip: [] as { target: string; reason: string }[],
    include: [] as string[],
    riskFlags: [] as string[],
  };

  for (const rule of question.branching_rules) {
    // Pri „Neviem" sa pravidlo vyhodnotí len vtedy, keď to samo deklaruje.
    // Podmienka sa nad prázdnou hodnotou NEVYHODNOCUJE — akcia sa vykoná
    // priamo, inak by sa single_choice a multi_select správali rôzne
    // (prázdny reťazec vs. prázdne pole).
    const applies = answer.isUnknown
      ? rule.on_unknown === 'apply'
      : evaluateCondition(rule.condition, answer);
    if (!applies) continue;

    const targets = Array.isArray(rule.target) ? rule.target : [rule.target];

    switch (rule.action) {
      case 'skip':
        for (const t of targets) result.skip.push({ target: t, reason: rule.reason });
        break;
      case 'include':
        result.include.push(...targets);
        break;
      case 'flag_risk':
        // Riziko sa pri „Neviem" nepriznáva ani vtedy, keď pravidlo deklaruje
        // `apply` — nevedomosť nie je dôkaz o probléme (viď SCORING_SPEC §5.3).
        if (!answer.isUnknown) result.riskFlags.push(...targets);
        break;
    }
  }

  return result;
}

/**
 * Evaluate a branching condition against an answer.
 */
function evaluateCondition(condition: string, answer: Answer): boolean {
  const val = answer.value;

  // value == 'x'
  const eqMatch = condition.match(/^value\s*==\s*'([^']+)'$/);
  if (eqMatch) {
    return val === eqMatch[1];
  }

  // value != 'x'
  const neqMatch = condition.match(/^value\s*!=\s*'([^']+)'$/);
  if (neqMatch) {
    return val !== neqMatch[1];
  }

  // value == 'x' || value == 'y' || ...
  const orMatch = condition.match(/^value\s*==\s*'[^']+'/);
  if (orMatch && condition.includes('||')) {
    const parts = condition.split('||').map(p => p.trim());
    return parts.some(part => {
      const m = part.match(/value\s*==\s*'([^']+)'/);
      return m ? val === m[1] : false;
    });
  }

  // selected_count <= N
  const countMatch = condition.match(/^selected_count\s*(<=|>=|<|>|==)\s*(\d+)$/);
  if (countMatch && Array.isArray(val)) {
    const count = val.length;
    const n = parseInt(countMatch[2]);
    switch (countMatch[1]) {
      case '<=': return count <= n;
      case '>=': return count >= n;
      case '<': return count < n;
      case '>': return count > n;
      case '==': return count === n;
    }
  }

  // selected.includes('x')
  const inclMatch = condition.match(/^selected\.includes\('([^']+)'\)$/);
  if (inclMatch && Array.isArray(val)) {
    return val.includes(inclMatch[1]);
  }

  // !selected.includes('x')
  const notInclMatch = condition.match(/^!selected\.includes\('([^']+)'\)$/);
  if (notInclMatch && Array.isArray(val)) {
    return !val.includes(notInclMatch[1]);
  }

  return false;
}

/**
 * Calculate score for an answer based on question type.
 */
export function calculateAnswerScore(question: Question, value: string | string[]): number {
  if (question.question_type === 'multi_select' && Array.isArray(value)) {
    // Invertované skórovanie: čím viac vybraných, tým nižšie skóre.
    // Režim sa deklaruje poľom `scoring_mode`. Predtým sa detegoval podľa
    // výskytu slova „Invertované" v `scoring_note` — prozaickej poznámke pre
    // ľudí, ktorá je v DB obyčajný TEXT. Preformulovanie alebo preklad tej
    // vety by ticho prepli otázku na štandardné sčítanie záporných hodnôt,
    // teda skóre 0 pre všetkých. Reťazec sa naďalej akceptuje kvôli starším
    // kompilátom, ktoré pole ešte nemajú.
    const isInverted =
      question.scoring_mode === 'inverted' || question.scoring_note?.includes('Invertované');
    if (isInverted) {
      const totalNeg = (question.options || [])
        .filter(o => value.includes(o.value))
        .reduce((sum, o) => sum + o.score, 0);
      return Math.max(0, 100 + totalNeg);
    }

    const selectedScore = (question.options || [])
      .filter(o => value.includes(o.value))
      .reduce((sum, o) => sum + o.score, 0);

    const maxScore = question.max_score || 100;
    return Math.min(100, Math.round((selectedScore / maxScore) * 100));
  }

  if (typeof value === 'string' && question.options) {
    const option = question.options.find(o => o.value === value);
    return option ? option.score : 0;
  }

  return 0;
}

/**
 * Check if the quiz is complete.
 */
export function isQuizComplete(
  questions: Question[],
  answers: Answer[],
  skippedIds: Set<string>
): boolean {
  return getNextQuestion(questions, answers, skippedIds) === null;
}

/**
 * Get the module name for a question (complex quiz).
 */
export function getModuleName(questionId: string): string {
  const modules = questionBank.complex_quiz.modules || [];
  for (const mod of modules) {
    if ((mod.questions as Question[]).some(q => q.id === questionId)) {
      return mod.name;
    }
  }
  return '';
}
