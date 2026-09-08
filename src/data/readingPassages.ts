import type { ReadingPassage } from '@/types'

/**
 * Reading content. One passage per difficulty band; every passage covers all
 * five required question types so the analytics breakdown is always populated.
 */
export const READING_PASSAGES: ReadingPassage[] = [
  {
    id: 'reading-beginner-bicycle',
    difficulty: 'beginner',
    title: 'The Quiet Return of the Bicycle',
    subtitle: 'How a nineteenth-century machine became a twenty-first-century solution',
    source: 'Adapted from an urban transport review',
    wordCount: 452,
    paragraphs: [
      {
        label: 'A',
        text: 'In the early twentieth century the bicycle was the fastest thing on most European roads. It carried factory workers to their shifts, doctors to their patients and post to its destination. Then the affordable motor car arrived, and within a generation the bicycle was reclassified in the public mind as a child\u2019s toy or the transport of people who could not afford anything better. For nearly fifty years city planners designed streets almost exclusively for drivers.',
      },
      {
        label: 'B',
        text: 'The reversal began in the Netherlands during the 1970s. Traffic deaths had climbed steeply, and more than four hundred of the victims in a single year were children. A protest movement called Stop de Kindermoord \u2014 Stop the Child Murder \u2014 filled Dutch streets with parents demanding safer roads. When the oil crisis of 1973 arrived a few months later, the government found itself with both a moral argument and an economic one. Neither factor alone would have been enough; together they made change unavoidable.',
      },
      {
        label: 'C',
        text: 'Results took decades to mature. Today roughly a quarter of all journeys in the Netherlands are made by bicycle, and in Amsterdam and Utrecht the figure approaches half. Cycling deaths per kilometre travelled have fallen dramatically. Researchers attribute this chiefly to separated cycle tracks, which keep riders physically away from heavy vehicles, rather than to protective equipment; in fact very few Dutch adults wear helmets at all.',
      },
      {
        label: 'D',
        text: 'Other cities have copied the Dutch model with strikingly uneven results. Seville built eighty kilometres of connected, physically separated lanes in barely three years, and the share of journeys made by bicycle rose from half a per cent to seven per cent. Elsewhere, authorities painted narrow lines along busy roads and recorded almost no increase at all. Transport researchers now argue that the decisive variable is not total kilometres built but whether the network feels safe to a cautious twelve-year-old \u2014 a benchmark planners call the eight-to-eighty test.',
      },
      {
        label: 'E',
        text: 'Electric bicycles have extended the picture further. By flattening hills and stretching comfortable range beyond fifteen kilometres, they have brought older riders and hillier cities into a market that was previously closed to them. Critics point to the widening speed gap on shared paths, which can make slower riders uncomfortable. Most researchers, however, agree that an electric bicycle substitutes for a car journey far more often than it substitutes for an ordinary cycle journey.',
      },
      {
        label: 'F',
        text: 'The return of the bicycle is not, in the end, a matter of nostalgia. It is a question of arithmetic. A dedicated cycle lane can move roughly five times as many people per hour, for each metre of its width, as a lane given over to cars, and it costs a small fraction of the sum required to build and maintain equivalent road capacity. For crowded cities running out of both space and money, that calculation is difficult to ignore.',
      },
    ],
    summaryTask: {
      title: 'Summary Completion \u2014 Questions 11\u201313',
      text: 'Dutch transport policy changed direction in the 1970s after a child-safety protest movement coincided with an (11) ______ crisis. Cities responded by building (12) ______ cycle tracks that keep riders away from motor traffic. Today about a (13) ______ of all journeys in the Netherlands are made by bicycle.',
    },
    questions: [
      {
        id: 'rb-q1',
        type: 'tfng',
        groupLabel: 'Questions 1\u20133: Do the statements agree with the information in the passage?',
        prompt: 'Most Dutch adults wear a helmet when they cycle.',
        options: ['True', 'False', 'Not Given'],
        correctIndex: 1,
        explanation:
          'Paragraph C states that "very few Dutch adults wear helmets at all", which contradicts the statement.',
      },
      {
        id: 'rb-q2',
        type: 'tfng',
        prompt:
          'The 1973 oil crisis was the only reason the Dutch government reconsidered its transport policy.',
        options: ['True', 'False', 'Not Given'],
        correctIndex: 1,
        explanation:
          'Paragraph B is explicit: "Neither factor alone would have been enough" \u2014 the protest movement mattered as much as the oil crisis.',
      },
      {
        id: 'rb-q3',
        type: 'tfng',
        prompt: "Seville's cycle network cost less to build than Amsterdam's.",
        options: ['True', 'False', 'Not Given'],
        correctIndex: 2,
        explanation:
          'The passage gives the length and the effect of the Seville network but never compares its cost with Amsterdam\u2019s.',
      },
      {
        id: 'rb-q4',
        type: 'main-idea',
        groupLabel: 'Questions 4\u20135: Choose the option that best expresses the main idea.',
        prompt: 'What is the main idea of paragraph D?',
        options: [
          'Seville now has more cyclists than any other European city.',
          'The success of a cycle network depends on whether it feels safe to nervous riders, not on its length.',
          'Painted lanes are cheaper to install than physically separated lanes.',
          'Cities outside the Netherlands should stop trying to copy Dutch policy.',
        ],
        correctIndex: 1,
        explanation:
          'Paragraph D contrasts Seville with cities that only painted lines, concluding that the "decisive variable" is perceived safety.',
      },
      {
        id: 'rb-q5',
        type: 'main-idea',
        prompt: 'Which title best summarises the passage as a whole?',
        options: [
          'The Dangers of Cycling in Modern Cities',
          'Why Electric Bicycles Will Replace Cars',
          'How Cities Rediscovered the Bicycle',
          'A History of Dutch Political Protest',
        ],
        correctIndex: 2,
        explanation:
          'The passage traces the bicycle\u2019s decline, its revival in the Netherlands, and its spread to other cities \u2014 a story of rediscovery.',
      },
      {
        id: 'rb-q6',
        type: 'inference',
        groupLabel: 'Questions 6\u20137: What can be inferred from the passage?',
        prompt: 'It can be inferred that the eight-to-eighty test is used to judge whether',
        options: [
          'a cycle route is long enough to be useful for commuters.',
          'a city has enough cyclists to justify further spending.',
          'infrastructure feels safe enough for the least confident riders.',
          'cyclists of different ages travel at similar speeds.',
        ],
        correctIndex: 2,
        explanation:
          'The benchmark is introduced through the image of "a cautious twelve-year-old", so it measures safety for the least confident users.',
      },
      {
        id: 'rb-q7',
        type: 'inference',
        prompt: 'The writer implies that painting cycle lanes onto busy roads is',
        options: [
          'an effective first step that most cities should take.',
          'unlikely on its own to persuade many people to cycle.',
          'more dangerous than having no cycle lane at all.',
          'illegal in several European countries.',
        ],
        correctIndex: 1,
        explanation:
          'Paragraph D notes that authorities who painted narrow lines "recorded almost no increase at all", implying the approach does not work by itself.',
      },
      {
        id: 'rb-q8',
        type: 'mcq',
        groupLabel: 'Questions 8\u201310: Choose the correct answer.',
        prompt:
          'According to paragraph C, cycling deaths per kilometre in the Netherlands fell mainly because',
        options: [
          'Dutch cyclists began wearing protective equipment.',
          'the number of motor vehicles on the roads decreased.',
          'separated tracks keep cyclists apart from heavy vehicles.',
          'cyclists were required to pass a safety examination.',
        ],
        correctIndex: 2,
        explanation:
          'The paragraph credits separated cycle tracks that "keep riders physically away from heavy vehicles".',
      },
      {
        id: 'rb-q9',
        type: 'mcq',
        prompt: 'What does paragraph F say about a dedicated cycle lane?',
        options: [
          'It carries about five times more people per metre of width than a car lane.',
          'It costs roughly the same as a car lane of similar length.',
          'It is only economical in cities with more than a million residents.',
          'It requires five times more maintenance than a car lane.',
        ],
        correctIndex: 0,
        explanation:
          'Paragraph F gives the figure directly: "roughly five times as many people per hour, for each metre of its width".',
      },
      {
        id: 'rb-q10',
        type: 'mcq',
        prompt: 'According to paragraph E, most researchers believe that an electric bicycle',
        options: [
          'is more dangerous than an ordinary bicycle on separated tracks.',
          'usually replaces a car journey rather than an ordinary cycle journey.',
          'is mainly bought by riders under the age of thirty.',
          'has a comfortable range of less than fifteen kilometres.',
        ],
        correctIndex: 1,
        explanation:
          'The final sentence of paragraph E states this substitution effect explicitly.',
      },
      {
        id: 'rb-q11',
        type: 'summary',
        groupLabel: 'Questions 11\u201313: Complete the summary using the word bank.',
        prompt: 'Gap 11 \u2014 a protest movement coincided with an ______ crisis.',
        options: ['oil', 'housing', 'banking', 'water'],
        correctIndex: 0,
        explanation: 'Paragraph B refers to "the oil crisis of 1973".',
      },
      {
        id: 'rb-q12',
        type: 'summary',
        prompt: 'Gap 12 \u2014 cities built ______ cycle tracks.',
        options: ['painted', 'separated', 'underground', 'temporary'],
        correctIndex: 1,
        explanation: 'Paragraph C credits "separated cycle tracks" for the safety improvement.',
      },
      {
        id: 'rb-q13',
        type: 'summary',
        prompt: 'Gap 13 \u2014 about a ______ of Dutch journeys are made by bicycle.',
        options: ['tenth', 'third', 'quarter', 'half'],
        correctIndex: 2,
        explanation:
          'Paragraph C: "roughly a quarter of all journeys in the Netherlands are made by bicycle".',
      },
    ],
  },
  {
    id: 'reading-intermediate-green-roofs',
    difficulty: 'intermediate',
    title: 'Cooling the City from Above',
    subtitle: 'Green roofs, urban heat and the limits of a popular solution',
    source: 'Adapted from an environmental science journal',
    wordCount: 528,
    paragraphs: [
      {
        label: 'A',
        text: 'On a still summer afternoon the centre of a large city can be seven degrees Celsius warmer than the farmland that surrounds it. This difference, known as the urban heat island effect, has little to do with the exhaust of vehicles or the waste heat of air conditioners, although both contribute at the margins. Its principal cause is far more mundane: dark, dense construction materials absorb solar radiation during the day and release it slowly through the night, so the city never fully cools down before the sun rises again.',
      },
      {
        label: 'B',
        text: 'A green roof \u2014 a shallow layer of soil and drought-tolerant plants installed above a waterproof membrane \u2014 attacks the problem through two separate mechanisms. The vegetation intercepts sunlight before it can reach the roof surface, and the moisture held in the soil evaporates, drawing heat energy out of the air in the process. Measurements taken in Toronto found that on a cloudless August day an exposed bitumen roof reached seventy degrees while an adjacent planted roof stayed below thirty.',
      },
      {
        label: 'C',
        text: 'The benefits extend beyond temperature. Because the growing medium behaves like a sponge, a green roof can retain between fifty and ninety per cent of the rainfall that lands on it, releasing the remainder slowly over the following hours. In cities where storm drains and sewers share a single pipe, this delay is significant: it reduces the chance that a sudden downpour will overwhelm the treatment works and send untreated water into rivers. Berlin and Basel both subsidise installations for this reason rather than for cooling.',
      },
      {
        label: 'D',
        text: 'Enthusiasm should nonetheless be tempered by engineering reality. Saturated soil is heavy, and a roof that was designed in 1960 to carry snow and maintenance workers may not tolerate an additional one hundred and fifty kilograms per square metre. Retrofitting an older structure can therefore cost several times the price of the planting itself. Maintenance is a further and frequently underestimated commitment: irrigation systems fail, drainage outlets block, and a neglected green roof degrades into a patch of dead sedum within two summers.',
      },
      {
        label: 'E',
        text: 'There is also a question of scale that advocates sometimes avoid. A single planted roof cools the building beneath it and the air immediately above it, but modelling studies consistently show that measurable change to a district\u2019s temperature requires coverage of a substantial share of the available roof area. Below that threshold the effect is real but local. This is why the most convincing programmes are municipal rather than individual: Singapore, Copenhagen and Stuttgart all combine mandates for new construction with grants for existing buildings.',
      },
      {
        label: 'F',
        text: 'Comparisons with alternatives are instructive. Painting a roof white is far cheaper and reflects more sunlight than plants absorb, but it provides no rainwater retention, no habitat and no insulation in winter. Street trees cool pedestrians at ground level, where people actually experience heat, yet they compete with underground services and take twenty years to mature. The emerging consensus is not that one approach wins, but that cities facing hotter decades will need all of them, chosen street by street.',
      },
    ],
    summaryTask: {
      title: 'Summary Completion \u2014 Questions 11\u201313',
      text: 'Green roofs lower surface temperature by shading the roof and by (11) ______, which removes heat from the surrounding air. They also retain a large share of (12) ______, easing pressure on combined sewer systems. However, older buildings often require expensive (13) ______ before installation is possible.',
    },
    questions: [
      {
        id: 'ri-q1',
        type: 'tfng',
        groupLabel: 'Questions 1\u20133: Do the statements agree with the information in the passage?',
        prompt: 'Vehicle exhaust is the main cause of the urban heat island effect.',
        options: ['True', 'False', 'Not Given'],
        correctIndex: 1,
        explanation:
          'Paragraph A says the principal cause is heat absorbed and re-released by construction materials; vehicles only "contribute at the margins".',
      },
      {
        id: 'ri-q2',
        type: 'tfng',
        prompt: 'Berlin subsidises green roofs primarily to manage stormwater rather than to cool the city.',
        options: ['True', 'False', 'Not Given'],
        correctIndex: 0,
        explanation:
          'Paragraph C states that Berlin and Basel subsidise installations "for this reason" \u2014 stormwater \u2014 "rather than for cooling".',
      },
      {
        id: 'ri-q3',
        type: 'tfng',
        prompt: 'Green roofs are more popular in Singapore than in Copenhagen.',
        options: ['True', 'False', 'Not Given'],
        correctIndex: 2,
        explanation:
          'Both cities are named as running strong municipal programmes, but the passage never compares their popularity.',
      },
      {
        id: 'ri-q4',
        type: 'main-idea',
        groupLabel: 'Questions 4\u20135: Choose the option that best expresses the main idea.',
        prompt: 'What is the main purpose of paragraph D?',
        options: [
          'To explain how green roofs are constructed.',
          'To argue that green roofs should be banned on older buildings.',
          'To set out the structural and maintenance costs that limit adoption.',
          'To compare the cost of green roofs in different countries.',
        ],
        correctIndex: 2,
        explanation:
          'The paragraph is devoted to load-bearing limits, retrofit expense and ongoing maintenance \u2014 the practical constraints.',
      },
      {
        id: 'ri-q5',
        type: 'main-idea',
        prompt: 'Which sentence best captures the overall argument of the passage?',
        options: [
          'Green roofs are an effective but partial tool that works best as part of a wider municipal strategy.',
          'Green roofs are the single most effective way to cool a modern city.',
          'White roofs should replace green roofs wherever budgets are limited.',
          'The urban heat island effect has been exaggerated by researchers.',
        ],
        correctIndex: 0,
        explanation:
          'The passage praises the mechanism, lists real limits, and closes by saying cities "will need all of them" \u2014 a partial-tool argument.',
      },
      {
        id: 'ri-q6',
        type: 'inference',
        groupLabel: 'Questions 6\u20137: What can be inferred from the passage?',
        prompt: 'It can be inferred from paragraph E that a lone green roof on one office block',
        options: [
          'will noticeably reduce temperatures across the whole district.',
          'produces a genuine but geographically limited cooling effect.',
          'has no measurable effect on temperature at all.',
          'increases the temperature of neighbouring buildings.',
        ],
        correctIndex: 1,
        explanation:
          'The paragraph says that below the coverage threshold "the effect is real but local".',
      },
      {
        id: 'ri-q7',
        type: 'inference',
        prompt: 'The comparison in paragraph F suggests that the writer regards white roofs as',
        options: [
          'superior to green roofs in every respect.',
          'useless in cities with cold winters.',
          'cheaper and highly reflective, but narrower in the benefits they deliver.',
          'the option most likely to be mandated by governments.',
        ],
        correctIndex: 2,
        explanation:
          'White roofs are described as "far cheaper" and more reflective, yet offering "no rainwater retention, no habitat and no insulation".',
      },
      {
        id: 'ri-q8',
        type: 'mcq',
        groupLabel: 'Questions 8\u201310: Choose the correct answer.',
        prompt: 'In the Toronto measurements described in paragraph B, the planted roof stayed below',
        options: ['twenty degrees', 'thirty degrees', 'fifty degrees', 'seventy degrees'],
        correctIndex: 1,
        explanation:
          'The bitumen roof reached seventy degrees while the planted roof "stayed below thirty".',
      },
      {
        id: 'ri-q9',
        type: 'mcq',
        prompt: 'According to paragraph C, a green roof can retain what proportion of rainfall?',
        options: [
          'Between ten and thirty per cent',
          'Between thirty and fifty per cent',
          'Between fifty and ninety per cent',
          'Almost one hundred per cent',
        ],
        correctIndex: 2,
        explanation: 'The figure is given directly in paragraph C.',
      },
      {
        id: 'ri-q10',
        type: 'mcq',
        prompt: 'What does paragraph F identify as a disadvantage of street trees?',
        options: [
          'They cool the air only at roof level.',
          'They need two decades to mature and conflict with buried utilities.',
          'They require more water than a green roof.',
          'They are more expensive than retrofitting a roof.',
        ],
        correctIndex: 1,
        explanation:
          'Street trees "compete with underground services and take twenty years to mature".',
      },
      {
        id: 'ri-q11',
        type: 'summary',
        groupLabel: 'Questions 11\u201313: Complete the summary using the word bank.',
        prompt: 'Gap 11 \u2014 green roofs cool buildings by shading and by ______.',
        options: ['reflection', 'evaporation', 'insulation', 'ventilation'],
        correctIndex: 1,
        explanation:
          'Paragraph B describes moisture that "evaporates, drawing heat energy out of the air".',
      },
      {
        id: 'ri-q12',
        type: 'summary',
        prompt: 'Gap 12 \u2014 they retain a large share of ______.',
        options: ['sunlight', 'rainfall', 'dust', 'carbon dioxide'],
        correctIndex: 1,
        explanation: 'Paragraph C explains rainfall retention of fifty to ninety per cent.',
      },
      {
        id: 'ri-q13',
        type: 'summary',
        prompt: 'Gap 13 \u2014 older buildings often need costly ______ first.',
        options: ['irrigation', 'insulation', 'strengthening', 'demolition'],
        correctIndex: 2,
        explanation:
          'Paragraph D explains that older roofs may not carry the extra load, making retrofitting \u2014 structural strengthening \u2014 expensive.',
      },
    ],
  },
  {
    id: 'reading-advanced-attention',
    difficulty: 'advanced',
    title: 'The Economics of Attention',
    subtitle: 'What happens when the scarcest resource is the human mind',
    source: 'Adapted from a media economics essay',
    wordCount: 561,
    paragraphs: [
      {
        label: 'A',
        text: 'In 1971 the political scientist Herbert Simon offered an observation that has aged with unusual grace. A wealth of information, he wrote, creates a poverty of attention. His point was structural rather than moralistic: as the cost of producing and distributing information collapses towards zero, the binding constraint on the system migrates elsewhere, and the only remaining scarcity is the finite number of hours a human being can spend attending to anything at all.',
      },
      {
        label: 'B',
        text: 'Markets reorganise themselves around whatever is scarce. Once attention became the constrained input, it acquired a price, and an industry emerged to harvest and resell it. The mechanism is now familiar. A platform offers a service without charge, measures the resulting engagement with considerable precision, and auctions access to that engagement. The user is not the customer in this arrangement, and the frequent complaint that such platforms treat people as a product is, in strictly economic terms, an accurate description rather than a rhetorical flourish.',
      },
      {
        label: 'C',
        text: 'What makes the arrangement unstable is a mismatch between what is measured and what is valued. Engagement is easy to observe: seconds watched, items scrolled, notifications opened. Satisfaction, comprehension and long-term wellbeing are not. When an optimisation system is given a proxy that correlates imperfectly with the outcome it is meant to serve, it will exploit the divergence relentlessly, because that is precisely what optimisation means. The result is not a conspiracy but an emergent property of the incentive structure.',
      },
      {
        label: 'D',
        text: 'Critics of this analysis raise a reasonable objection. Attention has always been contested; the penny press, the radio serial and the paperback novel were each accused in their day of degrading public reasoning, and each accusation now looks overwrought. The difference, defenders of the critique reply, is one of feedback speed. A newspaper editor learned whether a headline worked over weeks; a recommendation system learns within seconds and adjusts continuously across hundreds of millions of simultaneous experiments. Whether this constitutes a difference in degree or in kind remains genuinely unsettled.',
      },
      {
        label: 'E',
        text: 'Proposed remedies fall into three broad families. The first would change the price signal, replacing advertising with subscription so that the user becomes the customer again; critics note that this tends to reserve the calmest information environments for those who can pay for them. The second would regulate design directly, banning specific mechanisms such as infinite scroll or autoplay; the difficulty is that persuasive design is not a fixed list of features but a moving research frontier. The third would mandate transparency, exposing ranking systems to external audit \u2014 a modest intervention whose chief virtue is that it does not require regulators to decide in advance what a good outcome looks like.',
      },
      {
        label: 'F',
        text: 'Simon\u2019s formulation contained an implication that is easy to miss. If attention is genuinely scarce, then spending it is an economic act with an opportunity cost, and the relevant question for any individual is not whether a given piece of content is worthless but what was displaced in order to consume it. That framing shifts the burden in an uncomfortable direction, from the design of the system to the discipline of the person inside it \u2014 which is perhaps why it is the least discussed of the available responses.',
      },
    ],
    summaryTask: {
      title: 'Summary Completion \u2014 Questions 11\u201313',
      text: 'Simon argued that abundant information produces a scarcity of (11) ______. Platforms now measure engagement precisely because it is easy to observe, even though it is only an imperfect (12) ______ for user wellbeing. Of the remedies discussed, the author regards mandated (13) ______ as the most modest, since it does not require regulators to define good outcomes in advance.',
    },
    questions: [
      {
        id: 'ra-q1',
        type: 'tfng',
        groupLabel: 'Questions 1\u20133: Do the statements agree with the information in the passage?',
        prompt: 'The writer presents the behaviour of engagement-optimising systems as the result of deliberate conspiracy.',
        options: ['True', 'False', 'Not Given'],
        correctIndex: 1,
        explanation:
          'Paragraph C explicitly says the result "is not a conspiracy but an emergent property of the incentive structure".',
      },
      {
        id: 'ra-q2',
        type: 'tfng',
        prompt: 'The debate about whether rapid feedback represents a difference in kind has been resolved.',
        options: ['True', 'False', 'Not Given'],
        correctIndex: 1,
        explanation:
          'Paragraph D concludes that the question "remains genuinely unsettled".',
      },
      {
        id: 'ra-q3',
        type: 'tfng',
        prompt: 'Subscription-funded platforms attract fewer users than advertising-funded ones.',
        options: ['True', 'False', 'Not Given'],
        correctIndex: 2,
        explanation:
          'Paragraph E discusses subscription as a remedy and its equity problem, but says nothing about relative user numbers.',
      },
      {
        id: 'ra-q4',
        type: 'main-idea',
        groupLabel: 'Questions 4\u20135: Choose the option that best expresses the main idea.',
        prompt: 'What is the central claim of paragraph C?',
        options: [
          'Platforms deliberately conceal how their systems work.',
          'Optimising a measurable proxy that diverges from the real goal produces harmful outcomes automatically.',
          'Users are unable to judge which content benefits them.',
          'Engagement metrics are technically inaccurate.',
        ],
        correctIndex: 1,
        explanation:
          'The paragraph is built around the gap between the observable proxy (engagement) and the unobservable goal (wellbeing).',
      },
      {
        id: 'ra-q5',
        type: 'main-idea',
        prompt: 'Which statement best describes the function of paragraph D within the passage?',
        options: [
          'It introduces a counter-argument and the response it receives.',
          'It provides historical evidence that supports the writer\u2019s thesis without qualification.',
          'It abandons the argument developed in earlier paragraphs.',
          'It lists the technologies that will replace current platforms.',
        ],
        correctIndex: 0,
        explanation:
          'Paragraph D raises "a reasonable objection" from critics and then gives the defenders\u2019 reply about feedback speed.',
      },
      {
        id: 'ra-q6',
        type: 'inference',
        groupLabel: 'Questions 6\u20137: What can be inferred from the passage?',
        prompt: 'The writer\u2019s comment that the "product" complaint is "an accurate description rather than a rhetorical flourish" implies that',
        options: [
          'the complaint is usually exaggerated by campaigners.',
          'the criticism is factually correct given how the market is structured.',
          'platforms should be prevented from selling advertising.',
          'users are legally classified as commercial goods.',
        ],
        correctIndex: 1,
        explanation:
          'The writer is endorsing the claim as an economic description, not as emotive language.',
      },
      {
        id: 'ra-q7',
        type: 'inference',
        prompt: 'Paragraph F suggests that the writer finds the opportunity-cost framing uncomfortable because it',
        options: [
          'proves that platform design is irrelevant.',
          'places responsibility partly on the individual rather than only on the system.',
          'requires economic training that most readers lack.',
          'contradicts Simon\u2019s original argument.',
        ],
        correctIndex: 1,
        explanation:
          'The paragraph shifts the burden "from the design of the system to the discipline of the person inside it".',
      },
      {
        id: 'ra-q8',
        type: 'mcq',
        groupLabel: 'Questions 8\u201310: Choose the correct answer.',
        prompt: 'According to paragraph A, Simon\u2019s observation was primarily',
        options: [
          'a moral warning about declining standards.',
          'a structural claim about where scarcity moves.',
          'a prediction about the invention of the internet.',
          'a criticism of political institutions.',
        ],
        correctIndex: 1,
        explanation:
          'The text states his point was "structural rather than moralistic".',
      },
      {
        id: 'ra-q9',
        type: 'mcq',
        prompt: 'Which objection does the passage raise against the subscription remedy?',
        options: [
          'Subscriptions are technically difficult to administer.',
          'It gives the calmest information environments only to those who can afford them.',
          'It makes advertising more aggressive elsewhere.',
          'It has never been attempted at scale.',
        ],
        correctIndex: 1,
        explanation:
          'Paragraph E notes that subscription "tends to reserve the calmest information environments for those who can pay".',
      },
      {
        id: 'ra-q10',
        type: 'mcq',
        prompt: 'Why does the passage describe design regulation as difficult?',
        options: [
          'Because persuasive design keeps evolving rather than being a fixed set of features.',
          'Because infinite scroll is popular with users.',
          'Because regulators lack the legal power to intervene.',
          'Because engineers cannot agree on definitions.',
        ],
        correctIndex: 0,
        explanation:
          'Paragraph E calls persuasive design "a moving research frontier" rather than a fixed list.',
      },
      {
        id: 'ra-q11',
        type: 'summary',
        groupLabel: 'Questions 11\u201313: Complete the summary using the word bank.',
        prompt: 'Gap 11 \u2014 abundant information creates a scarcity of ______.',
        options: ['capital', 'attention', 'expertise', 'bandwidth'],
        correctIndex: 1,
        explanation: 'Simon\u2019s formulation: "a wealth of information creates a poverty of attention".',
      },
      {
        id: 'ra-q12',
        type: 'summary',
        prompt: 'Gap 12 \u2014 engagement is only an imperfect ______ for wellbeing.',
        options: ['proxy', 'penalty', 'contract', 'archive'],
        correctIndex: 0,
        explanation: 'Paragraph C describes engagement as "a proxy that correlates imperfectly" with the intended outcome.',
      },
      {
        id: 'ra-q13',
        type: 'summary',
        prompt: 'Gap 13 \u2014 the most modest remedy discussed is mandated ______.',
        options: ['subscription', 'taxation', 'transparency', 'moderation'],
        correctIndex: 2,
        explanation:
          'Paragraph E calls the transparency proposal "a modest intervention" that avoids defining good outcomes in advance.',
      },
    ],
  },
]

export function getReadingPassage(id: string): ReadingPassage {
  return READING_PASSAGES.find((passage) => passage.id === id) ?? READING_PASSAGES[0]
}

export function readingPassageForDifficulty(difficulty: string): ReadingPassage {
  return (
    READING_PASSAGES.find((passage) => passage.difficulty === difficulty) ?? READING_PASSAGES[1]
  )
}
