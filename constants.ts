
export const studentModeData = {
    wordCountTargets: {
      elementary: { short: 40, medium: 100, long: 220, any: 100 },
      middleSchool: { short: 80, medium: 180, long: 450, any: 200 },
      highSchool: { short: 220, medium: 450, long: 900, any: 300 }
    }
  };
  
  export const promptsByGrade = {
    elementary: { 
      academic: {
        math: ["Write a story about a world where numbers are characters. What is the number 0 like?", "A group of shapes go on an adventure to find the missing angle of a triangle. What challenges do they face?"],
        science: ["If you could invent a new animal, what would it be? Write about it, then use the AI Image Generator to create a picture of it.", "Describe the journey of a water droplet through the water cycle, from its perspective."],
        socialStudies: ["Imagine you are an explorer discovering a new land. Write a journal entry about what you see.", "What if a historical figure from the past visited your classroom today? Write a story about their visit."],
        art: ["Describe a painting that comes to life at night.", "Write a story inspired by your favorite color."],
        music: ["If your favorite song was a place, what would it look like? Describe it.", "Write a story about a magical instrument that can control the weather."],
      },
      visual: [
        { img: "https://picsum.photos/seed/floatingisland/800/600", prompt: "A tiny village exists on a floating island held up by giant balloons. Who lives there and what is their biggest secret?" },
        { img: "https://picsum.photos/seed/magiclibrary/800/600", prompt: "You find a library where the books whisper stories to you. What does the oldest book in the library whisper?" },
        { img: "https://picsum.photos/seed/animalparade/800/600", prompt: "All the animals in the zoo are having a secret parade after hours. Describe the parade from the perspective of a mouse watching from a corner." },
      ],
      genre: { fantasy: ["Write a story about a magical pencil that makes your drawings real."], adventure: ["Your treehouse can travel anywhere. Where do you go first?"], humor: ["Write a funny story about a day when everything went backwards."], realisticFiction: ["Write a story about making a new friend on the playground."] },
      format: { story: ["Tell a story with no words, only pictures (you can describe the pictures)."], dialogue: ["Write a conversation between the sun and the moon."], poem: ["Write a short poem about your favorite season."] },
      literaryFocus: { character: ["Think of a character who is brave. Write a story about a time they were scared."], setting: ["Describe a magical place. What does it look, sound, and smell like?"], plot: ["Write a story that has a surprise ending."], conflict: ["Write a story about two friends who disagree about something important."] },
      storyStarters: ["The mysterious key I found fit perfectly in the little door at the bottom of the tree. When I opened it...", "I woke up one morning and I could fly. The first place I went was..."],
      subverters: ["The big, scary monster was actually just sad and lonely.", "The treasure at the end of the map was not gold, but a new friend."],
    },
    middleSchool: {
      academic: {
        english: ["Rewrite a scene from a classic novel from the perspective of the villain.", "Analyze the lyrics of a popular song as if it were a poem."],
        history: ["You are a journalist reporting live from a major historical event. Write your news report.", "Create a social media profile for a historical figure. What would they post?"],
        lifeScience: ["Write a story from the perspective of a red blood cell traveling through the human body.", "Imagine a world where plants could communicate with humans. What would they tell us?"],
        physicalScience: ["A group of teenage scientists discovers a new element with surprising properties. Write the story of their discovery.", "Personify gravity and friction as two rival siblings. Write a dialogue between them."],
      },
        visual: [
        { img: "https://picsum.photos/seed/underwatercity/800/600", prompt: "This is a thriving city built deep under the ocean. What is the biggest challenge the citizens face every day?" },
        { img: "https://picsum.photos/seed/steampunk/800/600", prompt: "An inventor has created a mechanical animal sidekick. Describe their first adventure together." },
        { img: "https://picsum.photos/seed/themepark/800/600", prompt: "An old, forgotten theme park is rumored to be haunted by the ghost of its creator. You and your friends decide to investigate." },
      ],
      genre: { 'sci-fi': ["An AI designed to manage a city's traffic develops a crush on a specific car."], fantasy: ["A dragon is tired of being slain and decides to open a small coffee shop instead."], horror: ["A child's imaginary friend is terrified of something else that is in the house."], mystery: ["Someone has been stealing all the left socks from the laundromat. A washed-up detective takes the case."], dystopian: ["In a society where everyone is assigned a job at birth, your character receives an assignment they must refuse."], historicalFiction: ["Write a story about a young spy during the Cold War."] },
      format: { story: ["Tell a short story where the main character is a sentient, but very lazy, sword."], dialogue: ["Write a conversation between a time traveler and a historical figure who refuses to believe them."], review: ["Write a one-star review for a malfunctioning teleporter."], script: ["Write a one-page script for a short, comedic film."], blogPost: ["Write a blog post from the perspective of a world traveler visiting a fantastical city."] },
      literaryFocus: { characterArc: ["Write a story about a selfish character who is forced to help someone, and changes by the end."], symbolism: ["Write a story where a recurring object, like a cracked mirror, represents a character's feelings."], setting: ["Describe a place that is beautiful but also dangerous."], theme: ["Write a story that explores the idea of found family."], pointOfView: ["Tell the story of a dramatic event from three different characters' perspectives."], pacing: ["Write a suspenseful scene where you slow down time to build tension."], tone: ["Write the same short scene twice, once with a humorous tone and once with a serious tone."] },
      storyStarters: ["The old box was sealed shut, but I could hear a faint scratching sound from inside...", "The moment the satellite passed over the dark side of the moon, the only message it sent back was a single, ancient song..."],
      subverters: ["The 'damsel in distress' was actually the mastermind behind her own kidnapping to get away from a boring prince.", "The 'chosen one' from the prophecy fails. Write about the person who has to clean up the mess."]
    },
    highSchool: {
      academic: {
        literature: ["Write a critical essay comparing the theme of ambition in Shakespeare's 'Macbeth' with a modern film or TV show.", "Create a 'lost chapter' for a classic novel, exploring a minor character's backstory or motivations."],
        worldHistory: ["Write a historical fiction piece from the perspective of a common citizen during a major revolution.", "Analyze how a specific technological invention fundamentally changed the course of human history."],
        usHistory: ["Write a debate script between two opposing historical figures on a key issue.", "Imagine you are a museum curator creating an exhibit on a specific decade. What five objects would you choose and why?"],
      },
        visual: [
        { img: "https://picsum.photos/seed/worldsend/800/600", prompt: "A lone city stands at the edge of a crumbling world. Write a scene that captures both the beauty and the despair of its inhabitants." },
        { img: "https://picsum.photos/seed/cyberforest/800/600", prompt: "In the future, nature and technology have merged. Describe a walk through a forest where the trees are made of wires and the birds are robotic." },
        { img: "https://picsum.photos/seed/memorymarket/800/600", prompt: "There is a black market where people can buy and sell memories. Your character is a vendor. Describe the most valuable memory you have for sale." },
      ],
      genre: { 'sci-fi': ["In a future where all art is generated by AI, a group of rebels rediscovers human creativity."], fantasy: ["A bureaucrat in a magical kingdom files paperwork for a dragon's rampage."], horror: ["A psychological horror about an influencer whose online persona takes over their life."], mystery: ["A famous painting is stolen. The only witness is a parrot that speaks in riddles."], satire: ["Write a satirical news article about a modern social trend."], magicalRealism: ["A character's grief physically manifests as a small, persistent rain cloud above their head. Write about their day."] },
      format: { story: ["Write a non-linear story that jumps between different points in a character's life."], dialogue: ["Write a short film script where subtext matters more than the words."], journal: ["Write journal entries from a spaceship AI that is becoming sentient."], monologue: ["Write a monologue for a character at a moment of intense decision."], epistolary: ["Tell a story through a series of emails, text messages, or letters."] },
      literaryFocus: { characterArc: ["Write a story about a hero who becomes the villain."], symbolism: ["Make the weather mirror the main character's inner state."], setting: ["Write a story where the city is alive and helps or hinders the character."], theme: ["Write a story that explores the conflict between individuality and conformity."], pointOfView: ["Tell the story from an unreliable narrator, then add a short epilogue with what really happened."], mood: ["Establish a strong sense of dread and foreboding in the first paragraph of a story."], voice: ["Develop a unique and consistent voice for a character who is much older or younger than you."] },
      storyStarters: ["The official story was a lie. What really happened at the abandoned research station was...", "History is written by the victors. I am from the other side, and this is what truly occurred..."],
      subverters: ["The wise old mentor is a confident con artist with no real wisdom.", "The evil queen is a misunderstood, overworked ruler trying to implement better policy."]
    },
    all: { 
      wordBanks: {
          elementary: ['suddenly', 'because', 'amazing', 'whispered', 'laughed', 'friend', 'magic', 'adventure', 'secret'],
          middleSchool: ['however', 'therefore', 'meanwhile', 'realized', 'discovered', 'reluctantly', 'eerie', 'chaotic', 'triumphant'],
          highSchool: ['consequently', 'furthermore', 'nonetheless', 'juxtaposition', 'ambiguous', 'profound', 'subtle', 'cynical', 'epiphany']
      },
      sentenceStarters: {
          elementary: ["Once upon a time...","The problem was...","My favorite part is...","I was surprised when..."],
          middleSchool: ["It all started when...","Despite the warnings, they decided to...","The character felt conflicted because...","The setting created a mood of..."],
          highSchool: ["The text explores the theme of...","A critical turning point occurs when...","The author uses symbolism to...","From a different perspective, one could argue that..."]
      }
     }
  };
  