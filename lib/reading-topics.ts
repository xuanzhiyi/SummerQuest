export const READING_TOPICS = [
  'a surprising day at a summer sports camp',
  'a quiet forest path with an unexpected discovery',
  'a teenager building a useful robot at home',
  'a family trip across Finland by train',
  'a mystery object found near the sea',
  'a school project about protecting local nature',
  'a friendly competition between classmates',
  'a rainy afternoon that becomes an adventure',
  'a young musician preparing for a small concert',
  'a new student learning how to make friends',
  'a science experiment that teaches an important lesson',
  'a bicycle ride through a changing city',
  'a small act of kindness that changes someone day',
  'a visit to a museum with an unusual guide',
  'a football match where teamwork matters more than winning',
  'a camping night under the northern sky',
  'a clever solution to a problem at school',
  'a child learning to cook a traditional meal',
  'a lost pet and the search to bring it home',
  'a future city with cleaner transport',
  'a beach cleanup with friends',
  'a video game idea that teaches real skills',
  'a winter storm and a helpful neighbor',
  'a garden where every plant has a story',
  'a young detective solving a small neighborhood mystery',
  'a swimming lesson that builds confidence',
  'a book that changes how someone thinks',
  'a day without phones or computers',
  'a local festival full of music and food',
  'a hiking trip with a difficult choice',
  'a classroom debate about technology',
  'an animal rescue at a park',
  'a surprise message from another country',
  'a teenager practicing for a speech',
  'a smart invention that helps elderly people',
  'a friendship between people with different hobbies',
  'a map that leads to a forgotten place',
  'a small business started by children',
  'a lesson learned from making a mistake',
  'a city park redesigned by teenagers',
  'a family tradition during summer vacation',
  'a space mission designed by students',
  'a calm morning by a lake',
  'a cooking challenge with strange ingredients',
  'a sports injury and the patience to recover',
  'a community garden project',
  'a train delay that leads to meeting someone interesting',
  'a hidden talent discovered by accident',
  'a difficult puzzle solved with teamwork',
  'a plan to make school lunches better',
]

export function randomReadingTopic(): string {
  return READING_TOPICS[Math.floor(Math.random() * READING_TOPICS.length)]
}

export function withReadingTopic(basePrompt: string, topic = randomReadingTopic()): string {
  return `${basePrompt}

Use this specific topic for the passage: ${topic}.
Make the passage clearly about this topic. Do not switch to a generic hobby, school, sport, family, or weather passage unless it directly fits the topic.`
}
