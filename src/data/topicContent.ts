import { Word } from './vocabulary';

export const TOPIC_CONTENT: Record<string, Word[]> = {
    // 1. Daily Life & Survival
    'vocab-home': [
        { id: 1001, word: "Appliance", definition: "A device or piece of equipment designed to perform a specific task, such as cooking or cleaning.", example: "The kitchen is equipped with modern appliances.", phonetic: "/əˈplaɪ.əns/", category: "The Home" },
        { id: 1002, word: "Chore", definition: "A routine task, especially a household one.", example: "Doing the laundry is my least favorite chore.", phonetic: "/tʃɔːr/", category: "The Home" },
        { id: 1003, word: "Pantry", definition: "A small room or closet in which food, dishes, and utensils are kept.", example: "I checked the pantry for some snacks.", phonetic: "/ˈpæn.tri/", category: "The Home" },
        { id: 1004, word: "Faucet", definition: "A device by which a flow of liquid or gas from a pipe or container can be controlled; a tap.", example: "Don't forget to turn off the faucet.", phonetic: "/ˈfɔː.sət/", category: "The Home" },
    ],
    'vocab-food': [
        { id: 1101, word: "Simmer", definition: "To cook partially or entirely by boiling gently.", example: "Let the soup simmer for 20 minutes.", phonetic: "/ˈsɪm.ər/", category: "Food & Drink" },
        { id: 1102, word: "Appetizer", definition: "A small dish of food or a drink taken before a meal or the main course.", example: "We ordered nachos as an appetizer.", phonetic: "/ˈæp.ə.taɪ.zər/", category: "Food & Drink" },
        { id: 1103, word: "Cutlery", definition: "Knives, forks, and spoons used for eating or serving food.", example: "Please set the table with the silver cutlery.", phonetic: "/ˈkʌt.lər.i/", category: "Food & Drink" },
        { id: 1104, word: "Beverage", definition: "A drink, especially one other than water.", example: "May I offer you a hot beverage?", phonetic: "/ˈbev.ər.ɪdʒ/", category: "Food & Drink" },
    ],
    'vocab-transport': [
        { id: 1201, word: "Commute", definition: "A regular journey of some distance to and from one's place of work.", example: "His morning commute takes an hour.", phonetic: "/kəˈmjuːt/", category: "Transportation" },
        { id: 1202, word: "Fare", definition: "The money a passenger on public transportation has to pay.", example: "Bus fares have increased this year.", phonetic: "/fer/", category: "Transportation" },
        { id: 1203, word: "Itinerary", definition: "A planned route or journey.", example: "We have a packed itinerary for our trip to Japan.", phonetic: "/aɪˈtɪn.ə.rer.i/", category: "Transportation" },
        { id: 1204, word: "Pedestrian", definition: "A person walking along a road or in a developed area.", example: "This area is for pedestrians only.", phonetic: "/pəˈdes.tri.ən/", category: "Transportation" },
    ],
    'vocab-health': [
        { id: 1301, word: "Symptom", definition: "A physical or mental feature which is regarded as indicating a condition of disease.", example: "Fever is a common symptom of the flu.", phonetic: "/ˈsɪmp.təm/", category: "Health" },
        { id: 1302, word: "Prescription", definition: "An instruction written by a medical practitioner that authorizes a patient to be provided a medicine or treatment.", example: "The doctor gave me a prescription for antibiotics.", phonetic: "/prɪˈskrɪp.ʃən/", category: "Health" },
        { id: 1303, word: "Fatigue", definition: "Extreme tiredness resulting from mental or physical exertion or illness.", example: "She was suffering from fatigue after the marathon.", phonetic: "/fəˈtiːɡ/", category: "Health" },
        { id: 1304, word: "Immune System", definition: "The body's defense against infectious organisms and other invaders.", example: "Eating fruits helps boost your immune system.", phonetic: "/ɪˈmjuːn ˌsɪs.təm/", category: "Health" },
    ],
    'vocab-shopping': [
        { id: 1401, word: "Receipt", definition: "A written or printed statement acknowledging that something has been paid for.", example: "Keep your receipt in case you want to return the shirt.", phonetic: "/rɪˈsiːt/", category: "Shopping" },
        { id: 1402, word: "Bargain", definition: "A thing bought or offered for sale more cheaply than is usual or expected.", example: "This laptop was a real bargain.", phonetic: "/ˈbɑːr.ɡɪn/", category: "Shopping" },
        { id: 1403, word: "Changing Room", definition: "A room in a shop where you can try on clothes.", example: "Where are the changing rooms?", phonetic: "/ˈtʃeɪn.dʒɪŋ ˌruːm/", category: "Shopping" },
        { id: 1404, word: "Warranty", definition: "A written guarantee, promising to repair or replace it if necessary.", example: "The TV comes with a two-year warranty.", phonetic: "/ˈwɔːr.ən.ti/", category: "Shopping" },
    ],

    // 2. Professional & Business English
    'vocab-office': [
        { id: 2001, word: "Agenda", definition: "A list of items to be discussed at a formal meeting.", example: "What's on the agenda for today's meeting?", phonetic: "/əˈdʒen.də/", category: "Office" },
        { id: 2002, word: "Deadline", definition: "The latest time or date by which something should be completed.", example: "The deadline for the project is Friday.", phonetic: "/ˈded.laɪn/", category: "Office" },
        { id: 2003, word: "Colleague", definition: "A person with whom one works, especially in a profession or business.", example: "I'm going to lunch with a colleague.", phonetic: "/ˈkɒl.iːɡ/", category: "Office" },
        { id: 2004, word: "Quarterly", definition: "Done, produced, or occurring once every quarter of a year.", example: "We have our quarterly review next week.", phonetic: "/ˈkwɔːr.tər.li/", category: "Office" },
    ],
    'vocab-meetings': [
        { id: 2101, word: "Consensus", definition: "General agreement.", example: "We need to reach a consensus on this issue.", phonetic: "/kənˈsen.səs/", category: "Meetings" },
        { id: 2102, word: "Minutes", definition: "The written record of what was said at a meeting.", example: "Can you take the minutes during the call?", phonetic: "/ˈmɪn.ɪts/", category: "Meetings" },
        { id: 2103, word: "Touch base", definition: "To briefly contact someone.", example: "Let's touch base next week to see how you're doing.", phonetic: "/tʌtʃ beɪs/", category: "Meetings" },
        { id: 2104, word: "Action item", definition: "A specific task that needs to be done.", example: "Reviewing the budget is a key action item.", phonetic: "/ˈæk.ʃən ˌaɪ.t̬əm/", category: "Meetings" },
    ],
    'vocab-finance': [
        { id: 2201, word: "Asset", definition: "A useful or valuable thing, person, or quality.", example: "Our employees are our greatest asset.", phonetic: "/ˈæs.et/", category: "Finance" },
        { id: 2202, word: "Liability", definition: "The state of being responsible for something, especially by law.", example: "The company accepts no liability for delays.", phonetic: "/ˌlaɪ.əˈbɪl.ə.t̬i/", category: "Finance" },
        { id: 2203, word: "Revenue", definition: "Income, especially when of a company or organization and of a substantial nature.", example: "Revenue has increased by 10% this year.", phonetic: "/ˈrev.ə.nuː/", category: "Finance" },
        { id: 2204, word: "Investment", definition: "The action or process of investing money for profit or material result.", example: "We made a significant investment in new technology.", phonetic: "/ɪnˈvest.mənt/", category: "Finance" },
    ],
    'vocab-job': [
        { id: 2301, word: "Resume", definition: "A formal document that a job applicant creates to itemize their qualifications for a position.", example: "Please send your resume to HR.", phonetic: "/ˈrez.ju.meɪ/", category: "Job Hunting" },
        { id: 2302, word: "Candidate", definition: "A person who applies for a job or is nominated for election.", example: "She is the strongest candidate for the role.", phonetic: "/ˈkæn.dɪ.dət/", category: "Job Hunting" },
        { id: 2303, word: "Qualification", definition: "A quality or accomplishment that makes someone suitable for a particular job or activity.", example: "He has all the right qualifications.", phonetic: "/ˌkwɑː.lɪ.fɪˈkeɪ.ʃən/", category: "Job Hunting" },
        { id: 2304, word: "Networking", definition: "The action or process of interacting with others to exchange information and develop professional or social contacts.", example: "Networking is essential for career growth.", phonetic: "/ˈnet.wɝː.kɪŋ/", category: "Job Hunting" },
    ],

    // 3. Communication & Socializing
    'vocab-phrasal': [
        { id: 3001, word: "Look forward to", definition: "To await something with excitement.", example: "I look forward to meeting you.", phonetic: "/lʊk ˈfɔːr.wɚd tuː/", category: "Phrasal" },
        { id: 3002, word: "Bring up", definition: "To mention a topic.", example: "Don't bring up politics at dinner.", phonetic: "/brɪŋ ʌp/", category: "Phrasal" },
        { id: 3003, word: "Run out of", definition: "To have none left.", example: "We ran out of milk.", phonetic: "/rʌn aʊt əv/", category: "Phrasal" },
        { id: 3004, word: "Put off", definition: "To postpone.", example: "They put off the meeting until next week.", phonetic: "/pʊt ɑːf/", category: "Phrasal" },
    ],
    'vocab-idioms': [
        { id: 3101, word: "Break a leg", definition: "Good luck.", example: "Break a leg in your performance tonight!", phonetic: "/breɪk ə leɡ/", category: "Idioms" },
        { id: 3102, word: "Piece of cake", definition: "Something very easy to do.", example: "The exam was a piece of cake.", phonetic: "/piːs əv keɪk/", category: "Idioms" },
        { id: 3103, word: "Hit the hay", definition: "To go to sleep.", example: "I'm exhausted, time to hit the hay.", phonetic: "/hɪt ðə heɪ/", category: "Idioms" },
        { id: 3104, word: "Under the weather", definition: "Feeling sick.", example: "I'm feeling a bit under the weather today.", phonetic: "/ˈʌn.dɚ ðə ˈweð.ɚ/", category: "Idioms" },
    ],
    'vocab-social': [
        { id: 3201, word: "Acquaintance", definition: "A person one knows slightly, but who is not a close friend.", example: "He is just an acquaintance.", phonetic: "/əˈkweɪn.təns/", category: "Social" },
        { id: 3202, word: "Compliment", definition: "A polite expression of praise or admiration.", example: "She gave me a nice compliment on my dress.", phonetic: "/ˈkɑːm.plə.mənt/", category: "Social" },
        { id: 3203, word: "Apology", definition: "A regretful acknowledgment of an offense or failure.", example: "He sent a letter of apology.", phonetic: "/əˈpɑː.lə.dʒi/", category: "Social" },
        { id: 3204, word: "Catch up", definition: "To talk to someone you haven't seen for a while.", example: "Let's catch up over coffee.", phonetic: "/kætʃ ʌp/", category: "Social" },
    ],
    'vocab-emotions': [
        { id: 3301, word: "Ecstatic", definition: "Feeling or expressing overwhelming happiness or joyful excitement.", example: "I was ecstatic when I heard the news.", phonetic: "/ekˈstæt̬.ɪk/", category: "Emotions" },
        { id: 3302, word: "Melancholy", definition: "A feeling of pensive sadness, typically with no obvious cause.", example: "The rain always makes me feel a bit melancholy.", phonetic: "/ˈmel.əŋ.kɑː.li/", category: "Emotions" },
        { id: 3303, word: "Anxious", definition: "Experiencing worry, unease, or nervousness.", example: "He was anxious about the interview.", phonetic: "/ˈæŋk.ʃəs/", category: "Emotions" },
        { id: 3304, word: "Overwhelmed", definition: "Buried or drowned beneath a huge mass; defeated by someone or something by using a lot of force.", example: "She felt overwhelmed by the workload.", phonetic: "/ˌoʊ.vɚˈwelmd/", category: "Emotions" },
    ],

    // 4. Academic & Technical
    'vocab-science': [
        { id: 4001, word: "Hypothesis", definition: "A supposition or proposed explanation made on the basis of limited evidence.", example: "The results confirmed his hypothesis.", phonetic: "/haɪˈpɑː.θə.sɪs/", category: "Science" },
        { id: 4002, word: "Photosynthesis", definition: "The process by which green plants use sunlight to synthesize foods.", example: "Photosynthesis is vital for life on Earth.", phonetic: "/ˌfoʊ.t̬oʊˈsɪn.θə.sɪs/", category: "Science" },
        { id: 4003, word: "Algorithm", definition: "A process or set of rules to be followed in calculations.", example: "The search algorithm was updated.", phonetic: "/ˈæl.ɡə.rɪ.ðəm/", category: "Science" },
        { id: 4004, word: "Kinetic", definition: "Relating to or resulting from motion.", example: "Kinetic energy acts on the object.", phonetic: "/kɪˈnet̬.ɪk/", category: "Science" },
    ],
    'vocab-env': [
        { id: 4101, word: "Sustainable", definition: "Able to be maintained at a certain rate or level.", example: "We need more sustainable energy sources.", phonetic: "/səˈsteɪ.nə.bəl/", category: "Environment" },
        { id: 4102, word: "Biodiversity", definition: "The variety of life in the world or in a particular habitat.", example: "The rainforest has rich biodiversity.", phonetic: "/ˌbaɪ.oʊ.dɪˈvɝː.sə.t̬i/", category: "Environment" },
        { id: 4103, word: "Pollution", definition: "The presence in or introduction into the environment of a substance or thing that has harmful or poisonous effects.", example: "Air pollution is a major problem in cities.", phonetic: "/pəˈluː.ʃən/", category: "Environment" },
        { id: 4104, word: "Ecosystem", definition: "A biological community of interacting organisms and their physical environment.", example: "The coral reef ecosystem is fragile.", phonetic: "/ˈiː.koʊˌsɪs.təm/", category: "Environment" },
    ],
    'vocab-arts': [
        { id: 4201, word: "Abstract", definition: "Existing in thought or as an idea but not having a physical or concrete existence.", example: "I enjoy abstract art.", phonetic: "/ˈæb.strækt/", category: "Arts" },
        { id: 4202, word: "Genre", definition: "A category of artistic composition, as in music or literature.", example: "Sci-fi is my favorite genre.", phonetic: "/ˈʒɑːn.rə/", category: "Arts" },
        { id: 4203, word: "Metaphor", definition: "A figure of speech in which a word or phrase is applied to an object or action to which it is not literally applicable.", example: "The classroom was a zoo is a metaphor.", phonetic: "/ˈmet̬.ə.fɔːr/", category: "Arts" },
        { id: 4204, word: "Composition", definition: "The nature of something's ingredients or constituents; the way in which a whole or mixture is made up.", example: "The composition of the painting is balanced.", phonetic: "/ˌkɑːm.pəˈzɪʃ.ən/", category: "Arts" },
    ],
    'vocab-edu': [
        { id: 4301, word: "Curriculum", definition: "The subjects comprising a course of study in a school or college.", example: "The school has a rigorous curriculum.", phonetic: "/kəˈrɪk.jə.ləm/", category: "Education" },
        { id: 4302, word: "Plagiarism", definition: "The practice of taking someone else's work or ideas and passing them off as one's own.", example: "He was accused of plagiarism.", phonetic: "/ˈpleɪ.dʒɚ.ɪ.zəm/", category: "Education" },
        { id: 4303, word: "Dissertation", definition: "A long essay on a particular subject, especially one written for a university degree.", example: "She is writing her detailed dissertation.", phonetic: "/ˌdɪs.ɚˈteɪ.ʃən/", category: "Education" },
        { id: 4304, word: "Syllabus", definition: "An outline of the subjects in a course of study or teaching.", example: "Check the syllabus for the reading list.", phonetic: "/ˈsɪl.ə.bəs/", category: "Education" },
    ],

    // 5. Grammar-Based Vocabulary
    'vocab-temporal': [
        { id: 5001, word: "Seldom", definition: "Not often; rarely.", example: "I seldom go to the movies.", phonetic: "/ˈsel.dəm/", category: "Temporal" },
        { id: 5002, word: "Decade", definition: "A period of ten years.", example: "A lot has changed in the last decade.", phonetic: "/ˈdek.eɪd/", category: "Temporal" },
        { id: 5003, word: "Fortnight", definition: "A period of two weeks.", example: "They stayed for a fortnight.", phonetic: "/ˈfɔːrt.naɪt/", category: "Temporal" },
        { id: 5004, word: "Eventually", definition: "In the end, especially after a long delay, dispute, or series of problems.", example: "He eventually agreed to the plan.", phonetic: "/ɪˈven.tʃu.ə.li/", category: "Temporal" },
    ],
    'vocab-connectors': [
        { id: 5101, word: "However", definition: "Used to introduce a statement that contrasts with or seems to contradict something that has been said previously.", example: "I want to go; however, I am too busy.", phonetic: "/haʊˈev.ɚ/", category: "Connectors" },
        { id: 5102, word: "Therefore", definition: "For that reason; consequently.", example: "It was raining; therefore, we stayed inside.", phonetic: "/ˈðer.fɔːr/", category: "Connectors" },
        { id: 5103, word: "Furthermore", definition: "In addition; besides (used to introduce a fresh consideration in an argument).", example: "He is efficient, and furthermore, he is honest.", phonetic: "/ˈfɝː.ðɚ.mɔːr/", category: "Connectors" },
        { id: 5104, word: "Despite", definition: "Without being affected by; in spite of.", example: "He ran despite the pain.", phonetic: "/dɪˈspaɪt/", category: "Connectors" },
    ],
    'vocab-collocations': [
        { id: 5201, word: "Make a decision", definition: "To decide something.", example: "It's time to make a decision.", phonetic: "/meɪk ə dɪˈsɪʒ.ən/", category: "Collocations" },
        { id: 5202, word: "Do a favor", definition: "To help someone.", example: "Can you do me a favor?", phonetic: "/duː ə ˈfeɪ.vɚ/", category: "Collocations" },
        { id: 5203, word: "Take a break", definition: "To pull back from work for a short time.", example: "Let's take a break.", phonetic: "/teɪk ə breɪk/", category: "Collocations" },
        { id: 5204, word: "Catch a cold", definition: "To become sick with a cold.", example: "I think I caught a cold.", phonetic: "/kætʃ ə koʊld/", category: "Collocations" },
    ]
};
