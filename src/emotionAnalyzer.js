/**
 * emotionAnalyzer.js
 * AI 공감 다이어리 - 감정 분석 모듈
 *
 * 브라우저 환경 전용
 * OpenRouter API + nvidia/llama-nemotron-embed-vl-1b-v2:free 임베딩 모델 사용
 */

const EMOTION_ANCHORS = {
  기쁨: "오늘 정말 행복하고 즐거운 하루였어. 기분이 너무 좋아서 웃음이 멈추지 않아.",
  슬픔: "마음이 너무 무겁고 슬퍼서 눈물이 나. 가슴이 아프고 아무것도 하기 싫어.",
  분노: "너무 화가 나서 참을 수가 없어. 억울하고 짜증스러워서 소리라도 지르고 싶어.",
  불안: "앞으로 어떻게 될지 모르겠어서 너무 불안해. 걱정이 머릿속을 떠나지 않아.",
  피로: "몸도 마음도 너무 지쳐서 아무것도 못하겠어. 그냥 쉬고 싶은데 쉴 수가 없어.",
  외로움: "주변에 아무도 없는 것 같아서 너무 외로워. 나를 이해해주는 사람이 없는 것 같아.",
  감사: "정말 감사한 마음이 들어. 주변 사람들 덕분에 행복하다는 걸 새삼 느꼈어.",
  설렘: "앞으로 일어날 일들이 기대되고 두근거려. 새로운 시작이 너무 설레고 흥분돼.",
  무기력: "아무것도 하기 싫고 의욕이 전혀 없어. 그냥 멍하니 누워있고 싶어.",
  후회: "그때 그렇게 하지 말걸 그랬어. 다시 돌아갈 수 있다면 다르게 행동했을 텐데.",
};

const EMPATHY_MESSAGES = {
  기쁨: [
    "오늘 정말 기분 좋은 하루를 보낸 것 같아서 같이 기분이 좋아지네. 행복한 순간들이 이렇게 쌓여가는 거잖아. 오늘의 이 기분, 오래오래 기억해둬.",
    "그 기쁨이 글에서도 느껴져서 읽는 내내 미소가 지어졌어. 작은 것에서도 행복을 찾을 줄 아는 네가 대단해 보여. 앞으로도 이런 날들이 많았으면 좋겠다.",
    "이런 행복한 순간을 기록해두는 게 정말 잘한 일이야. 나중에 힘든 날이 생기면 오늘 이 글을 다시 꺼내 봐. 행복은 언제나 다시 찾아오거든.",
  ],
  슬픔: [
    "많이 힘들었구나. 그 슬픔이 그대로 느껴져서 마음이 짠해. 지금 이 감정 충분히 느껴도 괜찮아, 억누르지 않아도 돼.",
    "슬플 때 슬프다고 말할 수 있다는 것 자체가 용기 있는 일이야. 네 마음이 얼마나 아팠을지... 정말 수고했어. 조금씩 괜찮아질 거야.",
    "지금 이 슬픔이 영원하진 않을 거야. 슬픔도 흘러가게 되어 있거든. 오늘은 그냥 실컷 울고 쉬어도 돼, 내일은 조금 더 나아질 테니까.",
  ],
  분노: [
    "그 상황에서 화나는 게 당연해. 충분히 화낼 만한 일이었어. 네 감정은 틀리지 않았어.",
    "그 억울함이 얼마나 컸을지 느껴져. 화를 참느라 얼마나 힘들었을까. 지금은 그 감정을 충분히 인정해줘.",
    "화가 나는 건 네가 그만큼 진심으로 임했다는 증거이기도 해. 지금 당장은 좀 쉬고, 차분해지면 어떻게 할지 생각해봐도 늦지 않아.",
  ],
  불안: [
    "불안한 마음이 얼마나 힘들었을지... 머릿속이 쉴 새 없이 돌아가는 느낌이었겠다. 그 마음 충분히 이해해.",
    "걱정이 많아지면 더 힘들게 느껴지는 법이야. 지금 네가 느끼는 불안은 자연스러운 반응이야. 혼자 다 짊어지지 않아도 돼.",
    "불안할 때는 지금 이 순간에 집중해보는 게 도움이 될 수 있어. 미래의 일은 미래의 네가 해결할 거야. 지금 이 순간만큼은 조금 쉬어도 괜찮아.",
  ],
  피로: [
    "정말 많이 지쳤구나. 그동안 얼마나 열심히 달려왔으면... 지친 건 게으른 게 아니야, 충분히 노력했다는 증거야.",
    "몸과 마음이 이렇게 지쳤을 때는 쉬는 게 가장 용감한 선택이야. 무리하지 말고 오늘은 진짜로 푹 쉬어.",
    "지금 이 피로감이 네가 그동안 얼마나 많은 걸 해왔는지 말해주는 것 같아. 잠깐 멈추고 충전하는 시간이 꼭 필요해. 다시 달릴 힘은 반드시 생길 거야.",
  ],
  외로움: [
    "외롭다는 감정이 느껴질 때 얼마나 힘든지 알아. 그 마음이 충분히 전해져. 네 감정은 정말 솔직하고 소중해.",
    "혼자라는 느낌이 들 때 정말 마음이 공허하지. 그런데 이렇게 솔직하게 자신의 감정을 들여다볼 수 있다는 것 자체가 대단한 일이야.",
    "외로움을 느낀다는 건 연결을 원한다는 마음의 신호야. 지금 당장 아니더라도, 진심으로 통할 수 있는 사람이 분명 있어. 그 연결은 언제든 만들어질 수 있어.",
  ],
  감사: [
    "감사한 마음을 이렇게 담아낼 수 있다는 게 정말 따뜻하게 느껴져. 감사를 느끼는 사람 곁에는 좋은 것들이 모이게 되어 있어.",
    "그 감사함이 글에서 그대로 전해져. 주변을 이런 시선으로 바라볼 수 있다는 것, 정말 소중한 능력이야.",
    "오늘 느낀 감사함을 기록해둔 것, 정말 잘했어. 이런 마음들이 쌓여서 삶을 더 풍요롭게 만들어주거든. 오늘 하루 정말 빛났을 것 같아.",
  ],
  설렘: [
    "그 설레는 마음이 글에서도 느껴져서 같이 두근거리네. 새로운 시작 앞에서 느끼는 그 감정, 정말 소중해.",
    "설렘이라는 감정은 진짜 살아있다는 느낌을 주지. 그 두근거림 마음껏 느껴도 돼. 충분히 기대해도 좋아.",
    "기대가 크면 걱정도 생길 수 있지만, 지금 이 설레는 마음을 믿어봐. 준비된 만큼 좋은 일이 일어날 거야.",
  ],
  무기력: [
    "아무것도 하기 싫은 그 마음, 충분히 공감해. 의욕이 없을 때 억지로 뭔가를 해야 한다는 압박 자체가 또 힘들잖아.",
    "무기력함도 사실은 마음이 보내는 신호야. 너무 오래 달려왔거나, 방향을 잃어서 쉬고 싶다는 거지. 잠깐 멈춰서 쉬어가는 것도 완전히 괜찮아.",
    "지금 이 상태가 영원히 계속되지는 않아. 작은 것 하나라도 해냈을 때의 그 느낌이 다시 불씨가 되어줄 거야. 오늘은 그냥 쉬어도 충분해.",
  ],
  후회: [
    "그때로 돌아가고 싶다는 마음이 얼마나 간절했을지... 그 후회가 얼마나 무거웠을지 느껴져.",
    "후회가 생긴다는 건 그만큼 진심으로 임했다는 거야. 더 잘하고 싶었던 마음이 있었으니까. 그 마음 자체는 잘못이 아니야.",
    "과거는 바꿀 수 없지만, 그 경험이 앞으로의 너를 더 나은 방향으로 이끌어줄 거야. 후회를 통해 배우는 것, 그게 성장이잖아.",
  ],
};

function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error(`벡터 차원 불일치: vecA(${vecA.length}) vs vecB(${vecB.length})`);
  }
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return dotProduct / denominator;
}

async function fetchEmbedding(text, apiKey) {
  const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.href,
      "X-Title": "AI 공감 다이어리",
    },
    body: JSON.stringify({
      model: "nvidia/llama-nemotron-embed-vl-1b-v2:free",
      input: text,
    }),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API 오류 [${response.status}]: ${errorBody}`);
  }
  const data = await response.json();
  if (!data.data || !data.data[0] || !data.data[0].embedding) {
    throw new Error("API 응답에서 임베딩 벡터를 찾을 수 없습니다: " + JSON.stringify(data));
  }
  return data.data[0].embedding;
}

function pickEmpathyMessage(emotion) {
  const messages = EMPATHY_MESSAGES[emotion];
  if (!messages || messages.length === 0) {
    return "오늘도 솔직하게 마음을 털어놓아 줘서 고마워. 네 감정은 언제나 소중해.";
  }
  return messages[Math.floor(Math.random() * messages.length)];
}

function normalizeConfidences(similarities) {
  const scores = similarities.map((s) => s.confidence);
  const maxScore = Math.max(...scores);
  const expScores = scores.map((s) => Math.exp(s - maxScore));
  const sumExp = expScores.reduce((acc, v) => acc + v, 0);
  return similarities.map((s, i) => ({
    emotion: s.emotion,
    confidence: parseFloat((expScores[i] / sumExp).toFixed(4)),
  }));
}

export async function analyzeEmotion(diaryText, apiKey) {
  if (!diaryText || diaryText.trim().length === 0) {
    throw new Error("일기 텍스트를 입력해주세요.");
  }
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("OpenRouter API 키를 입력해주세요.");
  }
  const emotionNames = Object.keys(EMOTION_ANCHORS);
  const anchorTexts = Object.values(EMOTION_ANCHORS);
  const diaryEmbedding = await fetchEmbedding(diaryText.trim(), apiKey);
  const anchorEmbeddings = await Promise.all(
    anchorTexts.map((anchorText) => fetchEmbedding(anchorText, apiKey))
  );
  const similarities = emotionNames.map((emotion, index) => ({
    emotion,
    confidence: cosineSimilarity(diaryEmbedding, anchorEmbeddings[index]),
  }));
  similarities.sort((a, b) => b.confidence - a.confidence);
  const normalized = normalizeConfidences(similarities);
  const topEmotion = normalized[0];
  const top3 = normalized.slice(0, 3);
  const message = pickEmpathyMessage(topEmotion.emotion);
  return {
    emotion: topEmotion.emotion,
    confidence: topEmotion.confidence,
    top3,
    message,
  };
}

export function getSupportedEmotions() {
  return Object.keys(EMOTION_ANCHORS);
}

export function getEmpathyMessages(emotion) {
  return EMPATHY_MESSAGES[emotion] || [];
}
