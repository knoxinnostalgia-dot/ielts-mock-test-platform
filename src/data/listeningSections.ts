import type { ListeningSection } from '@/types'

/**
 * Listening content.
 *
 * Each clip carries a full transcript. If a matching MP3 exists in
 * `/public/audio/<id>.mp3` the player streams it; otherwise the player renders
 * the transcript through the browser speech-synthesis engine so the section is
 * always answerable offline. Either way the two-play limit is enforced.
 */
export const LISTENING_SECTIONS: ListeningSection[] = [
  {
    id: 'listening-beginner-library',
    difficulty: 'beginner',
    title: 'Section 1 \u2014 Everyday Enquiries',
    subtitle: 'A membership enquiry followed by a short public announcement',
    clips: [
      {
        id: 'lb-clip-1',
        title: 'Recording 1: Joining the Riverside Library',
        speakerLabel: 'Conversation \u00b7 2 speakers',
        audioSrc: '/audio/lb-clip-1.mp3',
        estimatedSeconds: 78,
        transcript:
          'Good morning, Riverside Community Library, Anna speaking. How can I help? Hello, I would like to join the library please. Certainly. Membership is free for anyone living in the district, and you will need one document showing your current address. A bank statement or a utility bill is fine, but we cannot accept a mobile phone bill. Right, I have a gas bill with me. That is perfect. Now, the standard card lets you borrow six items at a time for three weeks. Students may borrow twelve items, but you would need your student number for that. I finished studying last year, so the standard card is fine. No problem. One thing to note: the library closes at eight in the evening from Monday to Thursday, at six on Friday, and we are open from ten until four on Saturday. We are closed all day Sunday. And is there a fine if I return something late? Yes, twenty pence a day per item, although the first three days are free.',
      },
      {
        id: 'lb-clip-2',
        title: 'Recording 2: Weekend Programme Announcement',
        speakerLabel: 'Monologue \u00b7 announcement',
        audioSrc: '/audio/lb-clip-2.mp3',
        estimatedSeconds: 72,
        transcript:
          'Good afternoon everyone, and welcome to the Riverside Weekend Programme. Let me run through the main changes for this month. The children\u2019s reading hour has moved from the ground floor to the new activity room on the first floor, because the ground floor space is being used for the local history exhibition until the end of March. The conversation club for new speakers of English continues to meet every Thursday at half past six, and it is still completely free, though we now ask people to book online because the room only holds twenty. Our computer skills workshop has proved so popular that we have added a second session on Tuesday mornings. Finally, please remember that the car park behind the building is reserved for staff on weekdays. Visitors should use the public car park on Mill Street, which is a three-minute walk away and free for the first two hours.',
      },
    ],
    questions: [
      {
        id: 'lb-q1',
        clipId: 'lb-clip-1',
        type: 'detail',
        groupLabel: 'Questions 1\u20135 relate to Recording 1.',
        prompt: 'Which document can NOT be used as proof of address?',
        options: ['A bank statement', 'A gas bill', 'A mobile phone bill', 'A utility bill'],
        correctIndex: 2,
        explanation: 'Anna says "we cannot accept a mobile phone bill".',
      },
      {
        id: 'lb-q2',
        clipId: 'lb-clip-1',
        type: 'detail',
        prompt: 'How many items can a standard cardholder borrow at one time?',
        options: ['Three', 'Six', 'Nine', 'Twelve'],
        correctIndex: 1,
        explanation: 'The standard card allows six items for three weeks; twelve is the student allowance.',
      },
      {
        id: 'lb-q3',
        clipId: 'lb-clip-1',
        type: 'detail',
        prompt: 'On which day is the library closed?',
        options: ['Friday', 'Saturday', 'Sunday', 'Monday'],
        correctIndex: 2,
        explanation: '"We are closed all day Sunday."',
      },
      {
        id: 'lb-q4',
        clipId: 'lb-clip-1',
        type: 'vocabulary',
        prompt: 'The speaker mentions a "fine". In this context a fine is',
        options: [
          'a charge for returning an item late.',
          'a discount for regular borrowers.',
          'a deposit paid when joining.',
          'a fee for reserving a book.',
        ],
        correctIndex: 0,
        explanation: 'The fine is described as twenty pence per day per late item.',
      },
      {
        id: 'lb-q5',
        clipId: 'lb-clip-1',
        type: 'context',
        prompt: 'Why does the caller choose the standard card?',
        options: [
          'It allows more items than the student card.',
          'She is no longer a student.',
          'It is the only free option.',
          'She only needs it for three weeks.',
        ],
        correctIndex: 1,
        explanation: 'She says "I finished studying last year".',
      },
      {
        id: 'lb-q6',
        clipId: 'lb-clip-2',
        type: 'detail',
        groupLabel: 'Questions 6\u201310 relate to Recording 2.',
        prompt: 'Where does the children\u2019s reading hour now take place?',
        options: [
          'In the ground floor hall',
          'In the activity room on the first floor',
          'In the local history exhibition space',
          'In the Mill Street annexe',
        ],
        correctIndex: 1,
        explanation: 'It moved to "the new activity room on the first floor".',
      },
      {
        id: 'lb-q7',
        clipId: 'lb-clip-2',
        type: 'context',
        prompt: 'Why must people now book for the conversation club?',
        options: [
          'Because there is a new charge.',
          'Because the room holds only twenty people.',
          'Because it has moved to a different day.',
          'Because staff numbers have been reduced.',
        ],
        correctIndex: 1,
        explanation: 'Booking is required "because the room only holds twenty".',
      },
      {
        id: 'lb-q8',
        clipId: 'lb-clip-2',
        type: 'detail',
        prompt: 'What has been added to the computer skills workshop?',
        options: [
          'A second session on Tuesday mornings',
          'An online version',
          'A charge of twenty pence',
          'A qualified assistant',
        ],
        correctIndex: 0,
        explanation: 'Popularity led to "a second session on Tuesday mornings".',
      },
      {
        id: 'lb-q9',
        clipId: 'lb-clip-2',
        type: 'detail',
        prompt: 'Where should visitors park on a weekday?',
        options: [
          'Behind the library building',
          'On the first floor of the annexe',
          'In the public car park on Mill Street',
          'Anywhere in the district',
        ],
        correctIndex: 2,
        explanation: 'The rear car park is staff-only on weekdays; visitors use Mill Street.',
      },
      {
        id: 'lb-q10',
        clipId: 'lb-clip-2',
        type: 'main-idea',
        prompt: 'What is the main purpose of Recording 2?',
        options: [
          'To advertise a new library building',
          'To explain this month\u2019s changes to library activities',
          'To recruit volunteers for the history exhibition',
          'To announce an increase in membership fees',
        ],
        correctIndex: 1,
        explanation: 'The speaker introduces it as "the main changes for this month".',
      },
    ],
  },
  {
    id: 'listening-intermediate-fieldtrip',
    difficulty: 'intermediate',
    title: 'Section 2 \u2014 Study and Research',
    subtitle: 'A field trip briefing followed by an extract from a lecture on sleep',
    clips: [
      {
        id: 'li-clip-1',
        title: 'Recording 1: Coastal Geography Field Trip Briefing',
        speakerLabel: 'Conversation \u00b7 tutor and student',
        audioSrc: '/audio/li-clip-1.mp3',
        estimatedSeconds: 84,
        transcript:
          'Doctor Hale, I wanted to check the arrangements for the coastal field trip. Of course. We leave from the science building car park at seven fifteen, not seven thirty as it says on the original handout. The coach will not wait, so please be early. Understood. And how long is the journey? A little under three hours, with one stop. We should be on the beach by half past ten, which gives us the full low tide window. What should I bring? Waterproof boots are essential, because we will be working in the tidal zone for most of the morning. Bring a packed lunch as well; the village café closes for the winter. And your field notebook, obviously. Do we need the sampling equipment? No, the department supplies all of that, including the quadrats and the sediment tubes. What I do need from each of you is the risk assessment form, signed, before Friday. Without it the university insurance does not cover you, and I cannot let you board the coach.',
      },
      {
        id: 'li-clip-2',
        title: 'Recording 2: Lecture Extract \u2014 Why We Sleep in Cycles',
        speakerLabel: 'Monologue \u00b7 lecture',
        audioSrc: '/audio/li-clip-2.mp3',
        estimatedSeconds: 92,
        transcript:
          'Today I want to correct a common misunderstanding about sleep. People often describe it as a single block of unconsciousness, but sleep is in fact a repeating cycle lasting roughly ninety minutes, and we pass through four or five of these in a normal night. Each cycle contains both deep, slow-wave sleep and a phase called rapid eye movement, or REM. Crucially, the balance between them changes as the night progresses. Deep sleep dominates the early cycles, and that is when the body carries out most of its physical repair. REM becomes progressively longer towards morning, and REM appears to be when the brain consolidates memory and processes emotion. This asymmetry has a practical consequence that students frequently miss. If you sleep for only four hours, you do not lose forty per cent of every function evenly. You lose a disproportionate share of your REM sleep, because the REM-rich cycles are the ones you cut off at the end. That is why a short night damages recall far more than it damages physical recovery.',
      },
    ],
    questions: [
      {
        id: 'li-q1',
        clipId: 'li-clip-1',
        type: 'detail',
        groupLabel: 'Questions 1\u20135 relate to Recording 1.',
        prompt: 'What time does the coach leave?',
        options: ['Seven fifteen', 'Seven thirty', 'Ten thirty', 'Eight fifteen'],
        correctIndex: 0,
        explanation: 'The tutor corrects the handout: departure is at seven fifteen.',
      },
      {
        id: 'li-q2',
        clipId: 'li-clip-1',
        type: 'detail',
        prompt: 'Which item must students bring themselves?',
        options: ['Quadrats', 'Sediment tubes', 'A packed lunch', 'Safety helmets'],
        correctIndex: 2,
        explanation: 'The village café is closed for the winter, so students bring lunch.',
      },
      {
        id: 'li-q3',
        clipId: 'li-clip-1',
        type: 'context',
        prompt: 'Why must the risk assessment form be signed before Friday?',
        options: [
          'Otherwise insurance will not cover the student.',
          'Otherwise the student cannot borrow equipment.',
          'Because the coach company requires it.',
          'Because it counts towards the module grade.',
        ],
        correctIndex: 0,
        explanation: 'Without it "the university insurance does not cover you".',
      },
      {
        id: 'li-q4',
        clipId: 'li-clip-1',
        type: 'vocabulary',
        prompt: 'The tutor refers to the "tidal zone". This is the area',
        options: [
          'where the coach will park.',
          'covered and uncovered by the sea as the tide moves.',
          'reserved for university researchers.',
          'above the reach of the highest tide.',
        ],
        correctIndex: 1,
        explanation:
          'Waterproof boots are needed because the group works there during the low tide window.',
      },
      {
        id: 'li-q5',
        clipId: 'li-clip-1',
        type: 'detail',
        prompt: 'How long is the journey to the coast?',
        options: [
          'A little under two hours',
          'A little under three hours',
          'Exactly three hours',
          'More than four hours',
        ],
        correctIndex: 1,
        explanation: '"A little under three hours, with one stop."',
      },
      {
        id: 'li-q6',
        clipId: 'li-clip-2',
        type: 'main-idea',
        groupLabel: 'Questions 6\u201310 relate to Recording 2.',
        prompt: 'What misunderstanding does the lecturer set out to correct?',
        options: [
          'That sleep is a single uniform block of unconsciousness',
          'That REM sleep is harmful to memory',
          'That adults need eight hours of sleep',
          'That dreaming occurs only in deep sleep',
        ],
        correctIndex: 0,
        explanation: 'The opening states people wrongly describe sleep as "a single block".',
      },
      {
        id: 'li-q7',
        clipId: 'li-clip-2',
        type: 'detail',
        prompt: 'Approximately how long is one sleep cycle?',
        options: ['Thirty minutes', 'Sixty minutes', 'Ninety minutes', 'Two hours'],
        correctIndex: 2,
        explanation: 'The lecturer gives "roughly ninety minutes".',
      },
      {
        id: 'li-q8',
        clipId: 'li-clip-2',
        type: 'detail',
        prompt: 'According to the lecture, deep slow-wave sleep is associated mainly with',
        options: [
          'emotional processing',
          'physical repair',
          'memory consolidation',
          'rapid eye movement',
        ],
        correctIndex: 1,
        explanation: 'Deep sleep dominates early cycles when "the body carries out most of its physical repair".',
      },
      {
        id: 'li-q9',
        clipId: 'li-clip-2',
        type: 'context',
        prompt: 'Why does a four-hour night affect recall so severely?',
        options: [
          'Because every sleep function is reduced by forty per cent',
          'Because deep sleep is removed entirely',
          'Because the REM-rich later cycles are the ones lost',
          'Because the cycles become shorter than ninety minutes',
        ],
        correctIndex: 2,
        explanation:
          'The lecturer explains the loss is disproportionately REM, since REM-rich cycles come at the end of the night.',
      },
      {
        id: 'li-q10',
        clipId: 'li-clip-2',
        type: 'vocabulary',
        prompt: 'The lecturer uses the word "consolidates" to mean',
        options: [
          'erases temporary information.',
          'strengthens and stores information.',
          'transfers information to another person.',
          'compares information with earlier records.',
        ],
        correctIndex: 1,
        explanation: 'REM is described as the phase when the brain consolidates memory \u2014 makes it durable.',
      },
    ],
  },
  {
    id: 'listening-advanced-oceans',
    difficulty: 'advanced',
    title: 'Section 3 \u2014 Academic Discussion',
    subtitle: 'A supervision meeting followed by a research seminar extract',
    clips: [
      {
        id: 'la-clip-1',
        title: 'Recording 1: Dissertation Supervision',
        speakerLabel: 'Conversation \u00b7 supervisor and postgraduate',
        audioSrc: '/audio/la-clip-1.mp3',
        estimatedSeconds: 96,
        transcript:
          'So, I have read the draft methodology chapter. The design itself is sound, but I have two substantial reservations. Go on. First, your sample. You have recruited eighty participants entirely through university mailing lists, and then you generalise the findings to working adults. That is a sampling frame problem, not a sample size problem, so collecting another eighty the same way would not fix it. I see. Should I abandon the online recruitment? Not necessarily. You could keep it and simply narrow your claim to the population you actually sampled. That is the honest solution and it costs you nothing. And the second reservation? Your interview coding. You describe the themes as emerging from the data, but you also state that you began with a framework taken from the literature. Those two claims are in tension. Choose one and defend it. If you are using a prior framework, say so; deductive coding is perfectly respectable. What is not respectable is presenting a deductive analysis in inductive language. Right, that is fair. Rewrite those two sections and send them to me by the twenty-second, and we will look at the ethics application after that.',
      },
      {
        id: 'la-clip-2',
        title: 'Recording 2: Seminar Extract \u2014 Measuring Ocean Plastics',
        speakerLabel: 'Monologue \u00b7 research seminar',
        audioSrc: '/audio/la-clip-2.mp3',
        estimatedSeconds: 98,
        transcript:
          'The figure most often quoted in the press is that around eight million tonnes of plastic enter the ocean every year. What is less often reported is that when researchers actually survey the surface of the sea, they find only a small fraction of that mass. This gap is known in the field as the missing plastic problem, and it matters because the explanations carry very different policy implications. One possibility is that the input estimate is simply too high. A second is that plastics fragment into particles below the mesh size of standard sampling nets, which means they are present but invisible to our instruments. A third, and currently the best supported, is that a substantial share sinks, either because biological films make the particles denser or because they are ingested and excreted by marine organisms. If the third explanation is correct, then surface clean-up projects, however visually compelling, address a small and shrinking share of the total, and the more useful intervention is upstream, at the point where the material enters the water.',
      },
    ],
    questions: [
      {
        id: 'la-q1',
        clipId: 'la-clip-1',
        type: 'main-idea',
        groupLabel: 'Questions 1\u20135 relate to Recording 1.',
        prompt: 'What is the supervisor\u2019s overall assessment of the chapter?',
        options: [
          'The design is fundamentally flawed and must be replaced.',
          'The design is sound but two specific issues need correcting.',
          'The chapter is ready for submission.',
          'The chapter should be merged with the ethics application.',
        ],
        correctIndex: 1,
        explanation: '"The design itself is sound, but I have two substantial reservations."',
      },
      {
        id: 'la-q2',
        clipId: 'la-clip-1',
        type: 'detail',
        prompt: 'What kind of problem does the supervisor identify with the sample?',
        options: [
          'The sample is too small.',
          'The sampling frame does not match the population claimed.',
          'The participants were paid.',
          'The response rate was too low.',
        ],
        correctIndex: 1,
        explanation:
          'It is "a sampling frame problem, not a sample size problem" \u2014 recruiting more the same way would not help.',
      },
      {
        id: 'la-q3',
        clipId: 'la-clip-1',
        type: 'context',
        prompt: 'What solution does the supervisor recommend for the sampling issue?',
        options: [
          'Recruit eighty additional participants.',
          'Abandon online recruitment entirely.',
          'Narrow the claim to the population actually sampled.',
          'Change the research question.',
        ],
        correctIndex: 2,
        explanation: 'He calls narrowing the claim "the honest solution" that "costs you nothing".',
      },
      {
        id: 'la-q4',
        clipId: 'la-clip-1',
        type: 'vocabulary',
        prompt: 'The supervisor objects to "presenting a deductive analysis in inductive language". This means',
        options: [
          'using a pre-existing framework while claiming themes emerged from the data.',
          'analysing numerical data with qualitative methods.',
          'writing in an overly technical style.',
          'omitting the literature review.',
        ],
        correctIndex: 0,
        explanation:
          'The tension he identifies is between a framework "taken from the literature" and themes described as "emerging".',
      },
      {
        id: 'la-q5',
        clipId: 'la-clip-1',
        type: 'detail',
        prompt: 'What will the pair discuss after the rewritten sections are submitted?',
        options: [
          'The literature review',
          'The ethics application',
          'The viva arrangements',
          'The funding proposal',
        ],
        correctIndex: 1,
        explanation: '"We will look at the ethics application after that."',
      },
      {
        id: 'la-q6',
        clipId: 'la-clip-2',
        type: 'main-idea',
        groupLabel: 'Questions 6\u201310 relate to Recording 2.',
        prompt: 'What is the missing plastic problem?',
        options: [
          'Plastic waste disappearing from storage facilities',
          'The gap between estimated input and the mass observed at the sea surface',
          'The absence of reliable data on plastic production',
          'The failure of governments to report plastic exports',
        ],
        correctIndex: 1,
        explanation:
          'Surveys of the surface find "only a small fraction" of the estimated eight million tonnes.',
      },
      {
        id: 'la-q7',
        clipId: 'la-clip-2',
        type: 'detail',
        prompt: 'Which explanation does the speaker describe as currently best supported?',
        options: [
          'The input estimate is too high.',
          'Particles are smaller than sampling nets can capture.',
          'A large share of the plastic sinks.',
          'Plastic is degraded completely by sunlight.',
        ],
        correctIndex: 2,
        explanation: 'The third explanation \u2014 sinking \u2014 is called "currently the best supported".',
      },
      {
        id: 'la-q8',
        clipId: 'la-clip-2',
        type: 'detail',
        prompt: 'According to the speaker, what can make plastic particles denser?',
        options: [
          'Exposure to ultraviolet light',
          'Biological films forming on their surface',
          'Contact with cold water',
          'Compression at depth',
        ],
        correctIndex: 1,
        explanation: 'Biological films, or ingestion and excretion by organisms, are given as mechanisms.',
      },
      {
        id: 'la-q9',
        clipId: 'la-clip-2',
        type: 'context',
        prompt: 'What does the speaker imply about surface clean-up projects?',
        options: [
          'They are the most efficient use of research funding.',
          'They are visually appealing but address a shrinking share of the problem.',
          'They should be expanded to deeper water immediately.',
          'They have already removed most floating plastic.',
        ],
        correctIndex: 1,
        explanation:
          'They are "however visually compelling" targeting "a small and shrinking share of the total".',
      },
      {
        id: 'la-q10',
        clipId: 'la-clip-2',
        type: 'vocabulary',
        prompt: 'The speaker says the more useful intervention is "upstream". Here this means',
        options: [
          'in rivers rather than in the sea.',
          'at an earlier point, before the plastic reaches the water.',
          'at greater altitude.',
          'in wealthier countries only.',
        ],
        correctIndex: 1,
        explanation:
          'It is defined in the same sentence as "the point where the material enters the water".',
      },
    ],
  },
]

export function getListeningSection(id: string): ListeningSection {
  return LISTENING_SECTIONS.find((section) => section.id === id) ?? LISTENING_SECTIONS[0]
}

export function listeningSectionForDifficulty(difficulty: string): ListeningSection {
  return (
    LISTENING_SECTIONS.find((section) => section.difficulty === difficulty) ?? LISTENING_SECTIONS[1]
  )
}
