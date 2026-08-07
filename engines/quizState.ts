import type { Answer, Assessment, Question } from '@/types';
import { calculateAnswerScore, evaluateBranching } from '@/engines/questionEngine';

/** Akumulátor stavu kvízu počas aplikovania odpovedí. */
export interface QuizStateAcc {
  answers: Answer[];
  skipped: Set<string>;
  riskFlags: Set<string>;
  respondent: Assessment['respondent'];
}

/**
 * Aplikuje JEDNU odpoveď na stav kvízu: skóre, vetvenie, rizikové flagy,
 * syntetické `wasSkipped` záznamy a meta polia respondenta.
 *
 * Existuje ako samostatná funkcia preto, aby `SUBMIT_ANSWER` aj prehratie pri
 * `EDIT_ANSWER` robili PRESNE to isté. Keby si každá vetva držala vlastnú
 * kópiu tejto logiky, stav po oprave odpovede by sa časom rozišiel so stavom
 * z čerstvého behu — a rozdiel by sa prejavil až na skóre.
 */
export function applyAnswer(
  input: { questionId: string; value: string | string[]; isUnknown: boolean },
  questions: Question[],
  acc: QuizStateAcc,
  timestamp: string
): void {
  const question = questions.find(q => q.id === input.questionId);
  if (!question) return;

  const answer: Answer = {
    questionId: input.questionId,
    value: input.value,
    score: input.isUnknown ? 0 : calculateAnswerScore(question, input.value),
    isUnknown: input.isUnknown,
    wasSkipped: false,
    timestamp,
  };
  acc.answers.push(answer);

  // Vetvenie sa vyhodnocuje aj pri „Neviem" — pravidlo si samo určuje, či sa
  // vtedy uplatní (`on_unknown`). Predtým sa preskakovalo celé, takže
  // respondent, ktorý priznal nevedomosť, dostal najviac otázok.
  const branch = evaluateBranching(question, answer);
  branch.riskFlags.forEach(id => acc.riskFlags.add(id));

  // Preskočená otázka sa materializuje ako syntetická odpoveď s `wasSkipped`.
  // Bez toho sa nedalo odlíšiť „Neviem" od „nikdy sme sa nespýtali" — obe
  // vyzerali ako chýbajúca odpoveď a miešali sa do spoľahlivosti kategórie.
  for (const { target, reason } of branch.skip) {
    if (acc.skipped.has(target) || acc.answers.some(a => a.questionId === target)) continue;
    acc.skipped.add(target);
    acc.answers.push({
      questionId: target,
      value: '',
      score: 0,
      isUnknown: false,
      wasSkipped: true,
      skipReason: `${question.id}: ${reason}`,
      timestamp,
    });
  }

  if (question.maps_to_score.includes('benchmark_sector') && typeof input.value === 'string') {
    acc.respondent.sector = input.value;
  }
  if (question.maps_to_score.includes('benchmark_size') && typeof input.value === 'string') {
    acc.respondent.employeeCountBand = input.value as Assessment['respondent']['employeeCountBand'];
  }
}

/** Postaví stav kvízu od nuly z postupnosti odpovedí — základ `EDIT_ANSWER`. */
export function replayAnswers(
  inputs: { questionId: string; value: string | string[]; isUnknown: boolean }[],
  questions: Question[]
) {
  const acc = {
    answers: [] as Answer[],
    skipped: new Set<string>(),
    riskFlags: new Set<string>(),
    respondent: { sector: '', employeeCountBand: '' } as Assessment['respondent'],
  };
  // Časová pečiatka je pre všetky prehrané odpovede rovnaká: pôvodné časy sú
  // stratené a vymýšľať ich by znamenalo tvrdiť niečo, čo sa nestalo.
  const timestamp = new Date().toISOString();
  for (const input of inputs) {
    // Otázka, ktorá sa po zmene vetvenia preskočila, sa už neprehráva —
    // odpoveď na ňu respondent v novom priebehu nedal.
    if (acc.skipped.has(input.questionId)) continue;
    applyAnswer(input, questions, acc, timestamp);
  }
  return acc;
}

