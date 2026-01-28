import { Question } from './api/courses';

export const ethnicGroupQuestions: Record<string, Question[]> = {
  "1": [
    {
      id: 1,
      text: "Какова численность Татаров?",
      options: [
        "4,7 млн человек",
        "50 тыс. человек", 
        "1,6 млн человек",
        "16 тыс. человек"
      ],
      correctAnswer: 0
    },
    {
      id: 2,
      text: "Регион проживания Татаров?",
      options: [
        "Поволжье",
        "Алтайский край",
        "Восточная Сибирь", 
        "Приуралье"
      ],
      correctAnswer: 0
    },
    {
      id: 3,
      text: "Какое блюдо НЕ является национальным блюдом Татар?",
      options: [
        "Бишбирмак",
        "Чак-чак",
        "Эчпочмак",
        "Айран"
      ],
      correctAnswer: 0
    },
    {
      id: 4,
      text: "В каком веке произошло присоединение Казанского ханства к России?",
      options: [
        "В XVI веке",
        "В XVII веке", 
        "В XV веке",
        "Казанское ханство не входит в состав РФ"
      ],
      correctAnswer: 0,
      explanation: "Казань была взята войсками Ивана Грозного в 1552 году."
    },
    {
      id: 5,
      text: "Как называлась свободная рубаха у Татар?",
      options: [
        "күлмәк",
        "Бишмет",
        "Ичиги",
        "Папаха"
      ],
      correctAnswer: 0
    }
  ],
  
  "2": [
    {
      id: 1,
      text: "Какова численность Башкиров?",
      options: [
        "1,6 млн человек",
        "50 тыс. человек", 
        "4,7 млн человек",
        "16 тыс. человек"
      ],
      correctAnswer: 0,
    },
    {
      id: 2,
      text: "Регион проживания Башкиров?",
      options: [
        "Южный Урал и Приуралье",
        "Алтайский край",
        "Восточная Сибирь", 
        "Арктика"
      ],
      correctAnswer: 0,
    },
    {
      id: 3,
      text: "Как называется музыкальный символ Башкир?",
      options: [
        "Курай",
        "Балалайка", 
        "Гормонь",
        "Килень"
      ],
      correctAnswer: 0,
    },
    {
      id: 4,
      text: "Когда сложился Башкирский народ?",
      options: [
        "В IX-X вв.",
        "В XII-IX вв.",
        "В XI-XII вв.", 
        "В XV-XVI вв."
      ],
      correctAnswer: 0,
    },
    {
      id: 5,
      text: "В каком году появился Башкирский АССР?",
      options: [
        "В 1919 г",
        "В 1917 г", 
        "В 1945 г",
        "В 1819 г"
      ],
      correctAnswer: 0,
    }
  ],

  "3": [
    {
      id: 1,
      text: "Какова численность Ненцев?",
      options: [
        "50 тыс. человек",
        "16 тыс. человек", 
        "4,7 млн человек",
        "1,6 млн человек"
      ],
      correctAnswer: 0,
    },
    {
      id: 2,
      text: "Регион проживания Ненцев?",
      options: [
        "Ненецкий автономный округ",
        "Республика Карелия",
        "Саяны", 
        "Республика Саха (Якутия)"
      ],
      correctAnswer: 0,
    },
    {
      id: 3,
      text: "Какое основное занятие Ненцев?",
      options: [
        "Кочевание",
        "Рыболовство", 
        "Торговля",
        "Охота"
      ],
      correctAnswer: 0,
    },
    {
      id: 4,
      text: "Когда сложился Ненецкий народ?",
      options: [
        "5 в. до н.э.",
        "7 век н.э",
        "4 век н.э.", 
        "1 век н.э."
      ],
      correctAnswer: 0,
    },
    {
      id: 5,
      text: "В каком году Ненцы вошли в состав Российского Государства?",
      options: [
        "В XVI-XVII века",
        "В XV-XVI века", 
        "В XX-XXI века",
        "В XVIII-XIX века"
      ],
      correctAnswer: 0,
    }
  ],
  
  "4": [
    {
      id: 1,
      text: "Какова численность Чукчей?",
      options: [
        "16 тыс. человек",
        "50 тыс. человек", 
        "4,7 млн человек",
        "1,6 млн человек"
      ],
      correctAnswer: 0,
    },
    {
      id: 2,
      text: "Регион проживания Чукчей?",
      options: [
        "Чукотский автономный округ",
        "Республика Коми",
        "Красноярский край", 
        "Центральные регионы"
      ],
      correctAnswer: 0,
    },
    {
      id: 3,
      text: "Какое основное занятие Чукчей?",
      options: [
        "Оленьеводство",
        "Скотофодство", 
        "Растениеводство",
        "Экоферма"
      ],
      correctAnswer: 0,
    },
    {
      id: 4,
      text: "Когда сложился Чукотский народ?",
      options: [
        "1930-е годы",
        "1920-е годы",
        "1970-е годы", 
        "1950-е годы"
      ],
      correctAnswer: 0,
    },
    {
      id: 5,
      text: "В каком году был подписан мир. договор с Русскими?",
      options: [
        "В 1778 г",
        "В 1769 г", 
        "В 1779 г",
        "В 1771 г"
      ],
      correctAnswer: 0,
    }
  ]
};

// Функция для перемешивания вопросов и вариантов ответов
export function getRandomQuestions(ethnicGroupId: string): Question[] {
  const questions = ethnicGroupQuestions[ethnicGroupId];
  if (!questions) return [];
  
  const mixQuestions = [...questions].sort(() => Math.random() - 0.5);
  
  return mixQuestions.map(question => {
    const optionsWithIndices = question.options.map((option, index) => ({ option, index }));
    const mixOptions = [...optionsWithIndices].sort(() => Math.random() - 0.5);
    
    const newCorrectAnswer = mixOptions.findIndex(
      item => item.index === question.correctAnswer
    );
    
    return {
      ...question,
      options: mixOptions.map(item => item.option),
      correctAnswer: newCorrectAnswer,
    };
  });
}