export interface WordPair {
  wordId: string
  english: string
  target: string
  hint?: string // e.g. pinyin for Chinese
}

export type LanguagePair = 'english_finnish' | 'english_chinese' | 'english_swedish' | 'english_french'

export const PAIR_LABELS: Record<LanguagePair, { left: string; right: string; flag: string }> = {
  english_finnish: { left: 'English', right: 'Finnish', flag: '🇫🇮' },
  english_chinese: { left: 'English', right: 'Chinese', flag: '🀄' },
  english_swedish: { left: 'English', right: 'Swedish', flag: '🇸🇪' },
  english_french:  { left: 'English', right: 'French',  flag: '🇫🇷' },
}

export const WORDS_ENGLISH_FINNISH: WordPair[] = [
  { wordId: 'ef01', english: 'hello',       target: 'hei' },
  { wordId: 'ef02', english: 'thank you',   target: 'kiitos' },
  { wordId: 'ef03', english: 'yes',         target: 'kyllä' },
  { wordId: 'ef04', english: 'no',          target: 'ei' },
  { wordId: 'ef05', english: 'water',       target: 'vesi' },
  { wordId: 'ef06', english: 'food',        target: 'ruoka' },
  { wordId: 'ef07', english: 'house',       target: 'talo' },
  { wordId: 'ef08', english: 'dog',         target: 'koira' },
  { wordId: 'ef09', english: 'cat',         target: 'kissa' },
  { wordId: 'ef10', english: 'big',         target: 'iso' },
  { wordId: 'ef11', english: 'small',       target: 'pieni' },
  { wordId: 'ef12', english: 'good',        target: 'hyvä' },
  { wordId: 'ef13', english: 'bad',         target: 'huono' },
  { wordId: 'ef14', english: 'friend',      target: 'ystävä' },
  { wordId: 'ef15', english: 'school',      target: 'koulu' },
  { wordId: 'ef16', english: 'book',        target: 'kirja' },
  { wordId: 'ef17', english: 'car',         target: 'auto' },
  { wordId: 'ef18', english: 'sun',         target: 'aurinko' },
  { wordId: 'ef19', english: 'rain',        target: 'sade' },
  { wordId: 'ef20', english: 'summer',      target: 'kesä' },
  { wordId: 'ef21', english: 'winter',      target: 'talvi' },
  { wordId: 'ef22', english: 'eat',         target: 'syödä' },
  { wordId: 'ef23', english: 'drink',       target: 'juoda' },
  { wordId: 'ef24', english: 'run',         target: 'juosta' },
  { wordId: 'ef25', english: 'sleep',       target: 'nukkua' },
  { wordId: 'ef26', english: 'fast',        target: 'nopea' },
  { wordId: 'ef27', english: 'slow',        target: 'hidas' },
  { wordId: 'ef28', english: 'happy',       target: 'iloinen' },
  { wordId: 'ef29', english: 'day',         target: 'päivä' },
  { wordId: 'ef30', english: 'night',       target: 'yö' },
]

export const WORDS_ENGLISH_CHINESE: WordPair[] = [
  { wordId: 'ec01', english: 'hello',       target: '你好',   hint: 'nǐ hǎo' },
  { wordId: 'ec02', english: 'thank you',   target: '谢谢',   hint: 'xiè xiè' },
  { wordId: 'ec03', english: 'yes',         target: '是',     hint: 'shì' },
  { wordId: 'ec04', english: 'no',          target: '不',     hint: 'bù' },
  { wordId: 'ec05', english: 'water',       target: '水',     hint: 'shuǐ' },
  { wordId: 'ec06', english: 'food',        target: '食物',   hint: 'shí wù' },
  { wordId: 'ec07', english: 'house',       target: '房子',   hint: 'fáng zi' },
  { wordId: 'ec08', english: 'dog',         target: '狗',     hint: 'gǒu' },
  { wordId: 'ec09', english: 'cat',         target: '猫',     hint: 'māo' },
  { wordId: 'ec10', english: 'big',         target: '大',     hint: 'dà' },
  { wordId: 'ec11', english: 'small',       target: '小',     hint: 'xiǎo' },
  { wordId: 'ec12', english: 'good',        target: '好',     hint: 'hǎo' },
  { wordId: 'ec13', english: 'friend',      target: '朋友',   hint: 'péng yǒu' },
  { wordId: 'ec14', english: 'school',      target: '学校',   hint: 'xué xiào' },
  { wordId: 'ec15', english: 'book',        target: '书',     hint: 'shū' },
  { wordId: 'ec16', english: 'sun',         target: '太阳',   hint: 'tài yáng' },
  { wordId: 'ec17', english: 'rain',        target: '雨',     hint: 'yǔ' },
  { wordId: 'ec18', english: 'eat',         target: '吃',     hint: 'chī' },
  { wordId: 'ec19', english: 'drink',       target: '喝',     hint: 'hē' },
  { wordId: 'ec20', english: 'sleep',       target: '睡觉',   hint: 'shuì jiào' },
  { wordId: 'ec21', english: 'happy',       target: '开心',   hint: 'kāi xīn' },
  { wordId: 'ec22', english: 'fast',        target: '快',     hint: 'kuài' },
  { wordId: 'ec23', english: 'slow',        target: '慢',     hint: 'màn' },
  { wordId: 'ec24', english: 'summer',      target: '夏天',   hint: 'xià tiān' },
  { wordId: 'ec25', english: 'day',         target: '天',     hint: 'tiān' },
  { wordId: 'ec26', english: 'night',       target: '夜晚',   hint: 'yè wǎn' },
  { wordId: 'ec27', english: 'run',         target: '跑',     hint: 'pǎo' },
  { wordId: 'ec28', english: 'play',        target: '玩',     hint: 'wán' },
  { wordId: 'ec29', english: 'study',       target: '学习',   hint: 'xué xí' },
  { wordId: 'ec30', english: 'music',       target: '音乐',   hint: 'yīn yuè' },
]

export const WORDS_ENGLISH_SWEDISH: WordPair[] = [
  { wordId: 'es01', english: 'hello',       target: 'hej' },
  { wordId: 'es02', english: 'thank you',   target: 'tack' },
  { wordId: 'es03', english: 'yes',         target: 'ja' },
  { wordId: 'es04', english: 'no',          target: 'nej' },
  { wordId: 'es05', english: 'water',       target: 'vatten' },
  { wordId: 'es06', english: 'food',        target: 'mat' },
  { wordId: 'es07', english: 'house',       target: 'hus' },
  { wordId: 'es08', english: 'dog',         target: 'hund' },
  { wordId: 'es09', english: 'cat',         target: 'katt' },
  { wordId: 'es10', english: 'big',         target: 'stor' },
  { wordId: 'es11', english: 'small',       target: 'liten' },
  { wordId: 'es12', english: 'good',        target: 'bra' },
  { wordId: 'es13', english: 'friend',      target: 'vän' },
  { wordId: 'es14', english: 'school',      target: 'skola' },
  { wordId: 'es15', english: 'book',        target: 'bok' },
  { wordId: 'es16', english: 'sun',         target: 'sol' },
  { wordId: 'es17', english: 'rain',        target: 'regn' },
  { wordId: 'es18', english: 'summer',      target: 'sommar' },
  { wordId: 'es19', english: 'winter',      target: 'vinter' },
  { wordId: 'es20', english: 'eat',         target: 'äta' },
  { wordId: 'es21', english: 'drink',       target: 'dricka' },
  { wordId: 'es22', english: 'run',         target: 'springa' },
  { wordId: 'es23', english: 'sleep',       target: 'sova' },
  { wordId: 'es24', english: 'fast',        target: 'snabb' },
  { wordId: 'es25', english: 'happy',       target: 'glad' },
  { wordId: 'es26', english: 'day',         target: 'dag' },
  { wordId: 'es27', english: 'night',       target: 'natt' },
  { wordId: 'es28', english: 'play',        target: 'leka' },
  { wordId: 'es29', english: 'music',       target: 'musik' },
  { wordId: 'es30', english: 'car',         target: 'bil' },
]

export const WORDS_ENGLISH_FRENCH: WordPair[] = [
  { wordId: 'efr01', english: 'hello',      target: 'bonjour' },
  { wordId: 'efr02', english: 'thank you',  target: 'merci' },
  { wordId: 'efr03', english: 'yes',        target: 'oui' },
  { wordId: 'efr04', english: 'no',         target: 'non' },
  { wordId: 'efr05', english: 'water',      target: 'eau' },
  { wordId: 'efr06', english: 'food',       target: 'nourriture' },
  { wordId: 'efr07', english: 'house',      target: 'maison' },
  { wordId: 'efr08', english: 'dog',        target: 'chien' },
  { wordId: 'efr09', english: 'cat',        target: 'chat' },
  { wordId: 'efr10', english: 'big',        target: 'grand' },
  { wordId: 'efr11', english: 'small',      target: 'petit' },
  { wordId: 'efr12', english: 'good',       target: 'bon' },
  { wordId: 'efr13', english: 'friend',     target: 'ami' },
  { wordId: 'efr14', english: 'school',     target: 'école' },
  { wordId: 'efr15', english: 'book',       target: 'livre' },
  { wordId: 'efr16', english: 'sun',        target: 'soleil' },
  { wordId: 'efr17', english: 'rain',       target: 'pluie' },
  { wordId: 'efr18', english: 'summer',     target: 'été' },
  { wordId: 'efr19', english: 'winter',     target: 'hiver' },
  { wordId: 'efr20', english: 'eat',        target: 'manger' },
  { wordId: 'efr21', english: 'drink',      target: 'boire' },
  { wordId: 'efr22', english: 'run',        target: 'courir' },
  { wordId: 'efr23', english: 'sleep',      target: 'dormir' },
  { wordId: 'efr24', english: 'fast',       target: 'rapide' },
  { wordId: 'efr25', english: 'happy',      target: 'heureux' },
  { wordId: 'efr26', english: 'day',        target: 'jour' },
  { wordId: 'efr27', english: 'night',      target: 'nuit' },
  { wordId: 'efr28', english: 'play',       target: 'jouer' },
  { wordId: 'efr29', english: 'music',      target: 'musique' },
  { wordId: 'efr30', english: 'car',        target: 'voiture' },
]

const ALL_WORDS: Record<LanguagePair, WordPair[]> = {
  english_finnish: WORDS_ENGLISH_FINNISH,
  english_chinese: WORDS_ENGLISH_CHINESE,
  english_swedish: WORDS_ENGLISH_SWEDISH,
  english_french:  WORDS_ENGLISH_FRENCH,
}

export function getRandomWords(pair: LanguagePair, count = 5): WordPair[] {
  const list = [...ALL_WORDS[pair]]
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list.slice(0, count)
}
