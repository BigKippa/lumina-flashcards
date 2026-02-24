
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.join(__dirname, 'src', 'locales');

// Translations for the missing 'topics' section
const topicTranslations = {
    'es': {
        selection: {
            title: "Grupos de Vocabulario",
            subtitle: "Selecciona una categoría para explorar temas específicos",
            back_to_home: "Volver al Inicio",
            back_to_groups: "Volver a Grupos",
            student_library: "Biblioteca del Estudiante",
            cards_count: "{{count}} Tarjetas",
            surprise_me_title: "Sorpréndeme (Todo el Vocabulario)",
            surprise_me_subtitle: "Mezcla palabras de todos los temas de vocabulario",
            random_mix_title: "Mezcla Aleatoria de {{group}}",
            random_mix_subtitle: "Mezcla palabras de todos los temas en este grupo"
        },
        daily_life: {
            title: "Vida Diaria y Supervivencia",
            description: "Los bloques de construcción para cualquier estudiante principiante a intermedio.",
            home: { label: "El Hogar", desc: "Muebles, electrodomésticos y tareas domésticas." },
            food: { label: "Comida y Bebida", desc: "Comestibles, métodos de cocina y pedidos." },
            transport: { label: "Transporte", desc: "Navegar por el transporte público, conducir y aeropuertos." },
            health: { label: "Salud y Bienestar", desc: "Enfermedades comunes, partes del cuerpo y ejercicio." },
            shopping: { label: "Compras", desc: "Ropa, tallas, precios y devoluciones." }
        },
        business: {
            title: "Inglés Profesional y de Negocios",
            description: "Esencial para estudiantes que usan el inglés para avanzar en su carrera.",
            office: { label: "La Oficina", desc: "Papelería, tecnología y jerarquía." },
            meetings: { label: "Reuniones y Presentaciones", desc: "Modismos, frases de transición y lenguaje corporativo." },
            finance: { label: "Negociación y Finanzas", desc: "Contratos, banca y tendencias del mercado." },
            job: { label: "Búsqueda de Empleo", desc: "Palabras clave de currículum, verbos de entrevista y habilidades blandas." }
        },
        communication: {
            title: "Comunicación y Socialización",
            description: "Se centra en el 'pegamento' que mantiene unidas las conversaciones.",
            phrasal: { label: "Verbos Frasales", desc: "Agrupados por partícula o acción." },
            idioms: { label: "Modismos Comunes", desc: "Lenguaje figurado en el inglés cotidiano." },
            social: { label: "Socialización", desc: "Saludos, charlas triviales y expresiones corteses." },
            emotions: { label: "Emociones y Opiniones", desc: "Describir sentimientos y expresar acuerdo." }
        },
        academic: {
            title: "Académico y Técnico",
            description: "Para estudiantes que se preparan para exámenes como TOEFL o IELTS.",
            science: { label: "Ciencia y Tecnología", desc: "Biología, química y terminología de TI." },
            env: { label: "Medio Ambiente y Naturaleza", desc: "Cambio climático, geografía y animales." },
            arts: { label: "Las Artes", desc: "Literatura, música, cine y expresión creativa." },
            edu: { label: "Educación", desc: "Vida universitaria, asignaturas y hábitos de estudio." }
        },
        grammar: {
            title: "Vocabulario Basado en Gramática",
            description: "Aprender palabras por su función gramatical.",
            temporal: { label: "Palabras Temporales", desc: "Adverbios de frecuencia y marcadores de tiempo." },
            connectors: { label: "Conectores y Conjunciones", desc: "Construyendo oraciones complejas." },
            collocations: { label: "Colocaciones", desc: "Palabras que naturalmente van juntas." }
        }
    },
    'fr': {
        selection: {
            title: "Groupes de Vocabulaire",
            subtitle: "Sélectionnez une catégorie pour explorer des sujets spécifiques",
            back_to_home: "Retour à l'Accueil",
            back_to_groups: "Retour aux Groupes",
            student_library: "Bibliothèque Étudiante",
            cards_count: "{{count}} Cartes",
            surprise_me_title: "Surprenez-moi (Tout le Vocabulaire)",
            surprise_me_subtitle: "Mélangez les mots de tous les sujets de vocabulaire",
            random_mix_title: "Mélange Aléatoire de {{group}}",
            random_mix_subtitle: "Mélangez les mots de tous les sujets de ce groupe"
        },
        daily_life: {
            title: "Vie Quotidienne & Survie",
            description: "Les bases pour tout apprenant débutant à intermédiaire.",
            home: { label: "La Maison", desc: "Meubles, appareils électroménagers et tâches ménagères." },
            food: { label: "Nourriture & Boissons", desc: "Courses, méthodes de cuisson et commandes." },
            transport: { label: "Transport", desc: "Transports en commun, conduite et aéroports." },
            health: { label: "Santé & Bien-être", desc: "Maladies courantes, parties du corps et exercice." },
            shopping: { label: "Achats", desc: "Vêtements, tailles, prix et retours." }
        },
        business: {
            title: "Anglais Professionnel & des Affaires",
            description: "Essentiel pour les apprenants utilisant l'anglais pour leur carrière.",
            office: { label: "Le Bureau", desc: "Papeterie, technologie et hiérarchie." },
            meetings: { label: "Réunions & Présentations", desc: "Idiomes, phrases de transition et langage d'entreprise." },
            finance: { label: "Négociation & Finance", desc: "Contrats, banque et tendances du marché." },
            job: { label: "Recherche d'Emploi", desc: "Mots-clés de CV, verbes d'entretien et compétences relationnelles." }
        },
        communication: {
            title: "Communication & Socialisation",
            description: "Se concentre sur le 'lien' qui unit les conversations.",
            phrasal: { label: "Verbes à Particule", desc: "Groupés par particule ou action." },
            idioms: { label: "Idiomes Courants", desc: "Langage figuré dans l'anglais quotidien." },
            social: { label: "Socialisation", desc: "Salutations, petites conversations et expressions polies." },
            emotions: { label: "Émotions & Opinions", desc: "Décrire les sentiments et exprimer son accord." }
        },
        academic: {
            title: "Académique & Technique",
            description: "Pour les étudiants préparant des examens comme le TOEFL ou l'IELTS.",
            science: { label: "Science & Technologie", desc: "Biologie, chimie et terminologie informatique." },
            env: { label: "Environnement & Nature", desc: "Changement climatique, géographie et animaux." },
            arts: { label: "Les Arts", desc: "Littérature, musique, cinéma et expression créative." },
            edu: { label: "Éducation", desc: "Vie universitaire, matières et habitudes d'étude." }
        },
        grammar: {
            title: "Vocabulaire Basé sur la Grammaire",
            description: "Apprendre les mots par leur rôle grammatical.",
            temporal: { label: "Mots Temporels", desc: "Adverbes de fréquence et marqueurs de temps." },
            connectors: { label: "Connecteurs & Conjonctions", desc: "Construire des phrases complexes." },
            collocations: { label: "Collocations", desc: "Mots qui vont naturellement ensemble." }
        }
    },
    'pt': {
        selection: {
            title: "Grupos de Vocabulário",
            subtitle: "Selecione uma categoria para explorar tópicos específicos",
            back_to_home: "Voltar ao Início",
            back_to_groups: "Voltar aos Grupos",
            student_library: "Biblioteca do Aluno",
            cards_count: "{{count}} Cartões",
            surprise_me_title: "Surpreenda-me (Todo o Vocabulário)",
            surprise_me_subtitle: "Embaralhar palavras de todos os tópicos de vocabulário",
            random_mix_title: "Mistura Aleatória de {{group}}",
            random_mix_subtitle: "Embaralhar palavras de todos os tópicos deste grupo"
        },
        daily_life: {
            title: "Vida Diária e Sobrevivência",
            description: "Os blocos de construção para qualquer aluno iniciante a intermediário.",
            home: { label: "A Casa", desc: "Móveis, eletrodomésticos e tarefas domésticas." },
            food: { label: "Comida e Bebida", desc: "Mantimentos, métodos de cozimento e pedidos." },
            transport: { label: "Transporte", desc: "Navegação em transporte público, direção e aeroportos." },
            health: { label: "Saúde e Bem-estar", desc: "Doenças comuns, partes do corpo e exercícios." },
            shopping: { label: "Compras", desc: "Roupas, tamanhos, preços e devoluções." }
        },
        business: {
            title: "Inglês Profissional e de Negócios",
            description: "Essencial para alunos que usam o inglês para progresso na carreira.",
            office: { label: "O Escritório", desc: "Papelaria, tecnologia e hierarquia." },
            meetings: { label: "Reuniões e Apresentações", desc: "Expressões idiomáticas, frases de transição e linguagem corporativa." },
            finance: { label: "Negociação e Finanças", desc: "Contratos, bancos e tendências de mercado." },
            job: { label: "Procura de Emprego", desc: "Palavras-chave de currículo, verbos de entrevista e habilidades interpessoais." }
        },
        communication: {
            title: "Comunicação e Socialização",
            description: "Foca na 'cola' que mantém as conversas unidas.",
            phrasal: { label: "Phrasal Verbs", desc: "Agrupados por partícula ou ação." },
            idioms: { label: "Expressões Idiomáticas Comuns", desc: "Linguagem figurada no inglês cotidiano." },
            social: { label: "Socialização", desc: "Saudações, conversa fiada e expressões educadas." },
            emotions: { label: "Emoções e Opiniões", desc: "Descrever sentimentos e expressar concordância." }
        },
        academic: {
            title: "Acadêmico e Técnico",
            description: "Para alunos se preparando para exames como TOEFL ou IELTS.",
            science: { label: "Ciência e Tecnologia", desc: "Biologia, química e terminologia de TI." },
            env: { label: "Meio Ambiente e Natureza", desc: "Mudança climática, geografia e animais." },
            arts: { label: "As Artes", desc: "Literatura, música, cinema e expressão criativa." },
            edu: { label: "Educação", desc: "Vida universitária, matérias e hábitos de estudo." }
        },
        grammar: {
            title: "Vocabulário Baseado em Gramática",
            description: "Aprender palavras por seu papel gramatical.",
            temporal: { label: "Palavras Temporais", desc: "Advérbios de frequência e marcadores de tempo." },
            connectors: { label: "Conectores e Conjunções", desc: "Construindo frases complexas." },
            collocations: { label: "Colocações", desc: "Palavras que naturalmente andam juntas." }
        }
    },
    'it': {
        selection: {
            title: "Gruppi di Vocabolario",
            subtitle: "Seleziona una categoria per esplorare argomenti specifici",
            back_to_home: "Torna alla Home",
            back_to_groups: "Torna ai Gruppi",
            student_library: "Biblioteca Studente",
            cards_count: "{{count}} Carte",
            surprise_me_title: "Sorprendimi (Tutto il Vocabolario)",
            surprise_me_subtitle: "Mischia parole da tutti gli argomenti di vocabolario",
            random_mix_title: "Mix Casuale di {{group}}",
            random_mix_subtitle: "Mischia parole da tutti gli argomenti in questo gruppo"
        },
        daily_life: {
            title: "Vita Quotidiana & Sopravvivenza",
            description: "Le basi per qualsiasi studente principiante o intermedio.",
            home: { label: "La Casa", desc: "Mobili, elettrodomestici e faccende domestiche." },
            food: { label: "Cibo & Bevande", desc: "Spesa, metodi di cottura e ordinazioni." },
            transport: { label: "Trasporto", desc: "Muoversi con i mezzi pubblici, guidare e aeroporti." },
            health: { label: "Salute & Benessere", desc: "Malattie comuni, parti del corpo ed esercizio fisico." },
            shopping: { label: "Shopping", desc: "Abbigliamento, taglie, prezzi e resi." }
        },
        business: {
            title: "Inglese Professionale & Business",
            description: "Essenziale per chi usa l'inglese per avanzamento di carriera.",
            office: { label: "L'Ufficio", desc: "Cancelleria, tecnologia e gerarchia." },
            meetings: { label: "Riunioni & Presentazioni", desc: "Modi di dire, frasi di transizione e linguaggio aziendale." },
            finance: { label: "Negoziazione & Finanza", desc: "Contratti, banche e tendenze di mercato." },
            job: { label: "Ricerca Lavoro", desc: "Parole chiave per CV, verbi per colloqui e soft skills." }
        },
        communication: {
            title: "Comunicazione & Socializzazione",
            description: "Si concentra sul 'collante' che tiene insieme le conversazioni.",
            phrasal: { label: "Verbi Frasali", desc: "Raggruppati per particella o azione." },
            idioms: { label: "Modi di Dire Comuni", desc: "Linguaggio figurato nell'inglese quotidiano." },
            social: { label: "Socializzazione", desc: "Saluti, chiacchiere e espressioni educate." },
            emotions: { label: "Emozioni & Opinioni", desc: "Descrivere sentimenti ed esprimere accordo." }
        },
        academic: {
            title: "Accademico & Tecnico",
            description: "Per studenti che preparano esami come TOEFL o IELTS.",
            science: { label: "Scienza & Tecnologia", desc: "Biologia, chimica e terminologia IT." },
            env: { label: "Ambiente & Natura", desc: "Cambiamento climatico, geografia e animali." },
            arts: { label: "Le Arti", desc: "Letteratura, musica, cinema ed espressione creativa." },
            edu: { label: "Istruzione", desc: "Vita universitaria, materie e abitudini di studio." }
        },
        grammar: {
            title: "Vocabolario Basato sulla Grammatica",
            description: "Imparare le parole in base al loro ruolo grammaticale.",
            temporal: { label: "Parole Temporali", desc: "Avverbi di frequenza e marcatori temporali." },
            connectors: { label: "Connettori & Congiunzioni", desc: "Costruire frasi complesse." },
            collocations: { label: "Collocazioni", desc: "Parole che vanno naturalmente insieme." }
        }
    },
    'uk': {
        selection: {
            title: "Групи Словарь",
            subtitle: "Виберіть категорію для вивчення конкретних тем",
            back_to_home: "Назад на Головну",
            back_to_groups: "Назад до Grup",
            student_library: "Бібліотека Студента",
            cards_count: "{{count}} Карток",
            surprise_me_title: "Здивуй Мене (Весь Словник)",
            surprise_me_subtitle: "Перемішати слова з усіх тем словника",
            random_mix_title: "Випадковий Мікс {{group}}",
            random_mix_subtitle: "Перемішати слова з усіх тем у цій групі"
        },
        daily_life: {
            title: "Повсякденне Життя",
            description: "Основи для будь-якого початківця та середнього рівня.",
            home: { label: "Дім", desc: "Меблі, побутова техніка та домашні справи." },
            food: { label: "Їжа та Напої", desc: "Продукти, приготування їжі та замовлення." },
            transport: { label: "Транспорт", desc: "Громадський транспорт, водіння та аеропорти." },
            health: { label: "Здоров'я та Велнес", desc: "Поширені хвороби, частини тіла та вправи." },
            shopping: { label: "Покупки", desc: "Одяг, розміри, ціни та повернення." }
        },
        business: {
            title: "Професійна та Ділова Англійська",
            description: "Необхідно для кар'єрного зростання.",
            office: { label: "Офіс", desc: "Канцелярія, технології та ієрархія." },
            meetings: { label: "Зустрічі та Презентації", desc: "Ідіоми, фрази переходу та корпоративна мова." },
            finance: { label: "Переговори та Фінанси", desc: "Контракти, банківська справа та ринкові тенденції." },
            job: { label: "Пошук Роботи", desc: "Ключові слова резюме, дієслова інтерв'ю та м'які навички." }
        },
        communication: {
            title: "Спілкування та Соціалізація",
            description: "Фокусується на 'клеї', який тримає розмови разом.",
            phrasal: { label: "Фразові Дієслова", desc: "Згруповані за часткою або дією." },
            idioms: { label: "Поширені Ідіоми", desc: "Образна мова в повсякденній англійській." },
            social: { label: "Соціалізація", desc: "Привітання, світська бесіда та ввічливі вирази." },
            emotions: { label: "Емоції та Думки", desc: "Опис почуттів та вираження згоди." }
        },
        academic: {
            title: "Академічна та Технічна",
            description: "Для студентів, що готуються до іспитів TOEFL або IELTS.",
            science: { label: "Наука та Технології", desc: "Біологія, хімія та IT термінологія." },
            env: { label: "Довкілля та Природа", desc: "Зміна клімату, географія та тварини." },
            arts: { label: "Мистецтво", desc: "Література, музика, кіно та творчість." },
            edu: { label: "Освіта", desc: "Університетське життя, предмети та звички навчання." }
        },
        grammar: {
            title: "Граматичний Словник",
            description: "Вивчення слів за їх граматичною роллю.",
            temporal: { label: "Часові Слова", desc: "Прислівники частоти та маркери часу." },
            connectors: { label: "Конектори та Сполучники", desc: "Побудова складних речень." },
            collocations: { label: "Колокації", desc: "Слова, які природно поєднуються." }
        }
    },
    'hi': {
        selection: {
            title: "शब्दावली समूह",
            subtitle: "विशिष्ट विषयों का पता लगाने के लिए एक श्रेणी चुनें",
            back_to_home: "घर वापस",
            back_to_groups: "समूहों पर वापस",
            student_library: "छात्र पुस्तकालय",
            cards_count: "{{count}} कार्ड",
            surprise_me_title: "मुझे आश्चर्यचकित करो (सभी शब्दावली)",
            surprise_me_subtitle: "हर एक शब्दावली विषय से शब्दों को मिलाएं",
            random_mix_title: "{{group}} का यादृच्छिक मिश्रण",
            random_mix_subtitle: "इस समूह के सभी विषयों से शब्दों को मिलाएं"
        },
        daily_life: {
            title: "दैनिक जीवन और अस्तित्व",
            description: "किसी भी शुरुआती से मध्यवर्ती शिक्षार्थी के लिए निर्माण खंड।",
            home: { label: "घर", desc: "फर्नीचर, उपकरण और घरेलू काम।" },
            food: { label: "खाना और पीना", desc: "किराना, खाना पकाने के तरीके और ऑर्डर करना।" },
            transport: { label: "परिवहन", desc: "सार्वजनिक परिवहन, ड्राइविंग और हवाई अड्डों को नेविगेट करना।" },
            health: { label: "स्वास्थ्य और कल्याण", desc: "आम बीमारियां, शरीर के अंग और व्यायाम।" },
            shopping: { label: "खरीदारी", desc: "कपड़े, आकार, कीमतें और रिटर्न।" }
        },
        business: {
            title: "पेशेवर और व्यावसायिक अंग्रेजी",
            description: "करियर की प्रगति के लिए अंग्रेजी का उपयोग करने वाले शिक्षार्थियों के लिए आवश्यक।",
            office: { label: "कार्यालय", desc: "स्टेशनरी, तकनीक और पदानुक्रम।" },
            meetings: { label: "बैठकें और प्रस्तुतियाँ", desc: "मुहावरे, संक्रमण वाक्यांश और कॉर्पोरेट भाषा।" },
            finance: { label: "बातचीत और वित्त", desc: "अनुबंध, बैंकिंग और बाजार के रुझान।" },
            job: { label: "नौकरी की तलाश", desc: "रिज्यूमे कीवर्ड, साक्षात्कार क्रियाएं और सॉफ्ट स्किल्स।" }
        },
        communication: {
            title: "संचार और समाजीकरण",
            description: "'गोंद' पर ध्यान केंद्रित करता है जो बातचीत को एक साथ रखता है।",
            phrasal: { label: "वाक्यांश क्रियाएं", desc: "कण या क्रिया द्वारा समूहीकृत।" },
            idioms: { label: "आम मुहावरे", desc: "रोजमर्रा की अंग्रेजी में आलंकारिक भाषा।" },
            social: { label: "समाजीकरण", desc: "अभिवादन, छोटी बात और विनम्र अभिव्यक्ति।" },
            emotions: { label: "भावनाएं और राय", desc: "भावनाओं का वर्णन करना और सहमति व्यक्त करना।" }
        },
        academic: {
            title: "शैक्षणिक और तकनीकी",
            description: "TOEFL या IELTS जैसी परीक्षाओं की तैयारी करने वाले छात्रों के लिए।",
            science: { label: "विज्ञान और प्रौद्योगिकी", desc: "जीव विज्ञान, रसायन विज्ञान और आईटी शब्दावली।" },
            env: { label: "पर्यावरण और प्रकृति", desc: "जलवायु परिवर्तन, भूगोल और जानवर।" },
            arts: { label: "कला", desc: "साहित्य, संगीत, फिल्म और रचनात्मक अभिव्यक्ति।" },
            edu: { label: "शिक्षा", desc: "विश्वविद्यालय जीवन, विषय और अध्ययन की आदतें।" }
        },
        grammar: {
            title: "व्याकरण आधारित शब्दावली",
            description: "उनकी व्याकरणिक भूमिका द्वारा शब्द सीखना।",
            temporal: { label: "समय शब्द", desc: "आवृत्ति और समय मार्करों के क्रिया विशेषण।" },
            connectors: { label: "कनेक्टर्स और संयोजक", desc: "जटिल वाक्य बनाना।" },
            collocations: { label: "कोलोकेशन्स", desc: "ऐसे शब्द जो स्वाभाविक रूप से एक साथ चलते हैं।" }
        }
    },
    'zh': {
        selection: {
            title: "词汇组",
            subtitle: "选择一个类别以探索特定主题",
            back_to_home: "返回首页",
            back_to_groups: "返回组",
            student_library: "学生图书馆",
            cards_count: "{{count}} 张卡片",
            surprise_me_title: "给我惊喜（所有词汇）",
            surprise_me_subtitle: "从每个词汇主题中随机抽取单词",
            random_mix_title: "{{group}} 的随机混合",
            random_mix_subtitle: "混合该组中所有主题的单词"
        },
        daily_life: {
            title: "日常生活与生存",
            description: "任何初级到中级学习者的基石。",
            home: { label: "家", desc: "家具、电器和家务。" },
            food: { label: "食物与饮料", desc: "杂货、烹饪方法和点餐。" },
            transport: { label: "交通", desc: "乘坐公共交通、驾驶和机场。" },
            health: { label: "健康与保健", desc: "常见疾病、身体部位和锻炼。" },
            shopping: { label: "购物", desc: "服装、尺寸、价格和退货。" }
        },
        business: {
            title: "专业与商务英语",
            description: "对于使用英语进行职业发展的学习者至关重要。",
            office: { label: "办公室", desc: "文具、技术和等级制度。" },
            meetings: { label: "会议与演示", desc: "习语、过渡短语和公司语言。" },
            finance: { label: "谈判与金融", desc: "合同、银行和市场趋势。" },
            job: { label: "求职", desc: "简历关键词、面试动词和软技能。" }
        },
        communication: {
            title: "沟通与社交",
            description: "专注于维系对话的“粘合剂”。",
            phrasal: { label: "短语动词", desc: "按小品词或动作分组。" },
            idioms: { label: "常见习语", desc: "日常英语中的比喻语言。" },
            social: { label: "社交", desc: "问候、闲聊和礼貌用语。" },
            emotions: { label: "情绪与观点", desc: "描述感受和表达同意。" }
        },
        academic: {
            title: "学术与技术",
            description: "适合准备托福或雅思等考试的学生。",
            science: { label: "科学与技术", desc: "生物学、化学和IT术语。" },
            env: { label: "环境与自然", desc: "气候变化、地理和动物。" },
            arts: { label: "艺术", desc: "文学、音乐、电影和创造性表达。" },
            edu: { label: "教育", desc: "大学生活、科目和学习习惯。" }
        },
        grammar: {
            title: "基于语法的词汇",
            description: "通过语法角色学习单词。",
            temporal: { label: "时间词", desc: "频率副词和时间标记。" },
            connectors: { label: "连接词与连词", desc: "构建复杂句子。" },
            collocations: { label: "搭配", desc: "自然组合在一起的单词。" }
        }
    },
    'ja': {
        selection: {
            title: "語彙グループ",
            subtitle: "特定のトピックを探索するためにカテゴリを選択してください",
            back_to_home: "ホームに戻る",
            back_to_groups: "グループに戻る",
            student_library: "学生ライブラリ",
            cards_count: "{{count}} 枚のカード",
            surprise_me_title: "お任せ（全語彙）",
            surprise_me_subtitle: "すべての語彙トピックから単語をシャッフル",
            random_mix_title: "{{group}} のランダムミックス",
            random_mix_subtitle: "このグループのすべてのトピックから単語をシャッフル"
        },
        daily_life: {
            title: "日常生活とサバイバル",
            description: "初級から中級学習者のための基礎。",
            home: { label: "家", desc: "家具、家電、家事。" },
            food: { label: "食べ物と飲み物", desc: "食料品、調理法、注文。" },
            transport: { label: "交通", desc: "公共交通機関、運転、空港。" },
            health: { label: "健康とウェルネス", desc: "一般的な病気、体の部位、運動。" },
            shopping: { label: "買い物", desc: "衣類、サイズ、価格、返品。" }
        },
        business: {
            title: "プロフェッショナル＆ビジネス英語",
            description: "キャリアアップのために英語を使用する学習者に不可欠。",
            office: { label: "オフィス", desc: "文房具、技術、階層。" },
            meetings: { label: "会議とプレゼンテーション", desc: "慣用句、つなぎ言葉、企業用語。" },
            finance: { label: "交渉と金融", desc: "契約、銀行、市場トレンド。" },
            job: { label: "就職活動", desc: "履歴書のキーワード、面接の動詞、ソフトスキル。" }
        },
        communication: {
            title: "コミュニケーションと社交",
            description: "会話をつなぐ「接着剤」に焦点を当てています。",
            phrasal: { label: "句動詞", desc: "前置詞や動作でグループ化。" },
            idioms: { label: "一般的な慣用句", desc: "日常英語での比喩的な表現。" },
            social: { label: "社交", desc: "挨拶、世間話、丁寧な表現。" },
            emotions: { label: "感情と意見", desc: "気持ちを説明し、同意を表す。" }
        },
        academic: {
            title: "学術と技術",
            description: "TOEFLやIELTSなどの試験の準備をしている学生向け。",
            science: { label: "科学と技術", desc: "生物学、化学、IT用語。" },
            env: { label: "環境と自然", desc: "気候変動、地理、動物。" },
            arts: { label: "芸術", desc: "文学、音楽、映画、創造的表現。" },
            edu: { label: "教育", desc: "大学生活、科目、学習習慣。" }
        },
        grammar: {
            title: "文法に基づく語彙",
            description: "文法的な役割によって単語を学ぶ。",
            temporal: { label: "時間に関する言葉", desc: "頻度の副詞と時間マーカー。" },
            connectors: { label: "接続詞とつなぎ言葉", desc: "複雑な文を作成する。" },
            collocations: { label: "コロケーション", desc: "自然に一緒に使われる単語。" }
        }
    },
    'ko': {
        selection: {
            title: "어휘 그룹",
            subtitle: "특정 주제를 탐색하려면 카테고리를 선택하세요",
            back_to_home: "홈으로 돌아가기",
            back_to_groups: "그룹으로 돌아가기",
            student_library: "학생 도서관",
            cards_count: "{{count}} 카드",
            surprise_me_title: "랜덤 학습 (모든 어휘)",
            surprise_me_subtitle: "모든 어휘 주제에서 단어 섞기",
            random_mix_title: "{{group}} 의 랜덤 믹스",
            random_mix_subtitle: "이 그룹의 모든 주제에서 단어 섞기"
        },
        daily_life: {
            title: "일상 생활 및 생존",
            description: "초급부터 중급 학습자를 위한 기초.",
            home: { label: "집", desc: "가구, 가전 제품 및 집안일." },
            food: { label: "음식 및 음료", desc: "식료품, 요리 방법 및 주문." },
            transport: { label: "교통", desc: "대중 교통 이용, 운전 및 공항." },
            health: { label: "건강 및 웰빙", desc: "일반적인 질병, 신체 부위 및 운동." },
            shopping: { label: "쇼핑", desc: "의류, 사이즈, 가격 및 반품." }
        },
        business: {
            title: "전문 및 비즈니스 영어",
            description: "경력 발전을 위해 영어를 사용하는 학습자에게 필수적입니다.",
            office: { label: "사무실", desc: "문구, 기술 및 계층 구조." },
            meetings: { label: "회의 및 프레젠테이션", desc: "관용구, 전환 문구 및 기업 언어." },
            finance: { label: "협상 및 금융", desc: "계약, 은행 및 시장 동향." },
            job: { label: "구직", desc: "이력서 키워드, 면접 동사 및 소프트 스킬." }
        },
        communication: {
            title: "의사 소통 및 사교",
            description: "대화를 이어주는 '접착제'에 중점을 둡니다.",
            phrasal: { label: "구동사", desc: "조사 또는 행동별로 그룹화." },
            idioms: { label: "일반적인 관용구", desc: "일상 영어의 비유적 언어." },
            social: { label: "사교", desc: "인사, 잡담 및 공손한 표현." },
            emotions: { label: "감정 및 의견", desc: "감정 묘사 및 동의 표현." }
        },
        academic: {
            title: "학술 및 기술",
            description: "TOEFL 또는 IELTS와 같은 시험을 준비하는 학생들을 위한.",
            science: { label: "과학 및 기술", desc: "생물학, 화학 및 IT 용어." },
            env: { label: "환경 및 자연", desc: "기후 변화, 지리 및 동물." },
            arts: { label: "예술", desc: "문학, 음악, 영화 및 창의적 표현." },
            edu: { label: "교육", desc: "대학 생활, 과목 및 공부 습관." }
        },
        grammar: {
            title: "문법 기반 어휘",
            description: "문법적 역할에 따라 단어 학습.",
            temporal: { label: "시간 단어", desc: "빈도 부사 및 시간 표시." },
            connectors: { label: "연결어 및 접속사", desc: "복잡한 문장 만들기." },
            collocations: { label: "연어", desc: "자연스럽게 함께 쓰이는 단어들." }
        }
    },
    'ru': {
        selection: {
            title: "Группы Лексики",
            subtitle: "Выберите категорию для изучения конкретных тем",
            back_to_home: "Назад на Главную",
            back_to_groups: "Назад к Группам",
            student_library: "Библиотека Студента",
            cards_count: "{{count}} Карточек",
            surprise_me_title: "Удиви Меня (Вся Лексика)",
            surprise_me_subtitle: "Перемешать слова из всех тем",
            random_mix_title: "Случайный Микс {{group}}",
            random_mix_subtitle: "Перемешать слова из всех тем в этой группе"
        },
        daily_life: {
            title: "Повседневная Жизнь",
            description: "Основы для любого начинающего и среднего уровня.",
            home: { label: "Дом", desc: "Мебель, бытовая техника и домашние дела." },
            food: { label: "Еда и Напитки", desc: "Продукты, способы приготовления и заказ." },
            transport: { label: "Транспорт", desc: "Общественный транспорт, вождение и аэропорты." },
            health: { label: "Здоровье и Велнес", desc: "Распространенные болезни, части тела и упражнения." },
            shopping: { label: "Покупки", desc: "Одежда, размеры, цены и возврат." }
        },
        business: {
            title: "Профессиональный и Деловой Английский",
            description: "Необходимо для карьерного роста.",
            office: { label: "Офис", desc: "Канцелярия, технологии и иерархия." },
            meetings: { label: "Встречи и Презентации", desc: "Идиомы, фразы перехода и корпоративный язык." },
            finance: { label: "Переговоры и Финансы", desc: "Контракты, банковское дело и рыночные тенденции." },
            job: { label: "Поиск Работы", desc: "Ключевые слова резюме, глаголы интервью и мягкие навыки." }
        },
        communication: {
            title: "Общение и Социализация",
            description: "Фокусируется на 'клее', который держит разговоры вместе.",
            phrasal: { label: "Фразовые Глаголы", desc: "Сгруппированы по частице или действию." },
            idioms: { label: "Распространенные Идиомы", desc: "Образный язык в повседневном английском." },
            social: { label: "Социализация", desc: "Приветствия, светская беседа и вежливые выражения." },
            emotions: { label: "Эмоции и Мнения", desc: "Описание чувств и выражение согласия." }
        },
        academic: {
            title: "Академический и Технический",
            description: "Для студентов, готовящихся к экзаменам TOEFL или IELTS.",
            science: { label: "Наука и Технологии", desc: "Биология, химия и IT терминология." },
            env: { label: "Окружающая Среда и Природа", desc: "Изменение климата, география и животные." },
            arts: { label: "Искусство", desc: "Литература, музыка, кино и творчество." },
            edu: { label: "Образование", desc: "Университетская жизнь, предметы и учебные привычки." }
        },
        grammar: {
            title: "Грамматическая Лексика",
            description: "Изучение слов по их грамматической роли.",
            temporal: { label: "Временные Слова", desc: "Наречия частоты и маркеры времени." },
            connectors: { label: "Коннекторы и Союзы", desc: "Построение сложных предложений." },
            collocations: { label: "Коллокации", desc: "Слова, которые естественно сочетаются." }
        }
    },
    'de': {
        selection: {
            title: "Wortschatzgruppen",
            subtitle: "Wählen Sie eine Kategorie, um bestimmte Themen zu erkunden",
            back_to_home: "Zurück zur Startseite",
            back_to_groups: "Zurück zu Gruppen",
            student_library: "Studentenbibliothek",
            cards_count: "{{count}} Karten",
            surprise_me_title: "Überrasche mich (Gesamter Wortschatz)",
            surprise_me_subtitle: "Mische Wörter aus allen Wortschatzthemen",
            random_mix_title: "Zufälliger Mix von {{group}}",
            random_mix_subtitle: "Mische Wörter aus allen Themen dieser Gruppe"
        },
        daily_life: {
            title: "Alltag & Überleben",
            description: "Die Bausteine für jeden Anfänger bis Fortgeschrittenen.",
            home: { label: "Zuhause", desc: "Möbel, Geräte und Hausarbeit." },
            food: { label: "Essen & Trinken", desc: "Lebensmittel, Kochmethoden und Bestellen." },
            transport: { label: "Verkehr", desc: "Navigieren im öffentlichen Verkehr, Fahren und Flughäfen." },
            health: { label: "Gesundheit & Wellness", desc: "Häufige Krankheiten, Körperteile und Bewegung." },
            shopping: { label: "Einkaufen", desc: "Kleidung, Größen, Preise und Rückgaben." }
        },
        business: {
            title: "Berufs- & Geschäftsenglisch",
            description: "Unverzichtbar für Lernende, die Englisch für den beruflichen Aufstieg nutzen.",
            office: { label: "Das Büro", desc: "Schreibwaren, Technologie und Hierarchie." },
            meetings: { label: "Meetings & Präsentationen", desc: "Redewendungen, Übergangsphrasen und Unternehmenssprache." },
            finance: { label: "Verhandlung & Finanzen", desc: "Verträge, Bankwesen und Markttrends." },
            job: { label: "Arbeitssuche", desc: "Lebenslauf-Schlüsselwörter, Interviewverben und Soft Skills." }
        },
        communication: {
            title: "Kommunikation & Sozialisierung",
            description: "Konzentriert sich auf den 'Klebstoff', der Gespräche zusammenhält.",
            phrasal: { label: "Phrasal verbs", desc: "Gruppiert nach Partikel oder Aktion." },
            idioms: { label: "Häufige Redewendungen", desc: "Bildhafte Sprache im Alltagenglisch." },
            social: { label: "Sozialisierung", desc: "Begrüßungen, Smalltalk und höfliche Ausdrücke." },
            emotions: { label: "Emotionen & Meinungen", desc: "Gefühle beschreiben und Zustimmung ausdrücken." }
        },
        academic: {
            title: "Akademisch & Technisch",
            description: "Für Studenten, die sich auf Prüfungen wie TOEFL oder IELTS vorbereiten.",
            science: { label: "Wissenschaft & Technologie", desc: "Biologie, Chemie und IT-Terminologie." },
            env: { label: "Umwelt & Natur", desc: "Klimawandel, Geographie und Tiere." },
            arts: { label: "Die Künste", desc: "Literatur, Musik, Film und kreativer Ausdruck." },
            edu: { label: "Bildung", desc: "Universitätsleben, Fächer und Lerngewohnheiten." }
        },
        grammar: {
            title: "Grammatikbasierter Wortschatz",
            description: "Wörter nach ihrer grammatikalischen Rolle lernen.",
            temporal: { label: "Zeitwörter", desc: "Häufigkeitsadverbien und Zeitmarkierungen." },
            connectors: { label: "Verbindungen & Konjunktionen", desc: "Komplexe Sätze bilden." },
            collocations: { label: "Kollokationen", desc: "Wörter, die natürlich zusammenpassen." }
        }
    },
    'tr': {
        selection: {
            title: "Kelime Grupları",
            subtitle: "Belirli konuları keşfetmek için bir kategori seçin",
            back_to_home: "Ana Sayfaya Dön",
            back_to_groups: "Gruplara Dön",
            student_library: "Öğrenci Kütüphanesi",
            cards_count: "{{count}} Kart",
            surprise_me_title: "Beni Şaşırt (Tüm Kelimeler)",
            surprise_me_subtitle: "Tüm kelime konularından kelimeleri karıştır",
            random_mix_title: "{{group}} Karışık",
            random_mix_subtitle: "Bu gruptaki tüm konulardan kelimeleri karıştır"
        },
        daily_life: {
            title: "Günlük Yaşam & Hayatta Kalma",
            description: "Her başlangıç ve orta seviye öğrenci için yapı taşları.",
            home: { label: "Ev", desc: "Mobilya, aletler ve ev işleri." },
            food: { label: "Yiyecek & İçecek", desc: "Bakkaliye, pişirme yöntemleri ve sipariş." },
            transport: { label: "Ulaşım", desc: "Toplu taşıma, sürüş ve havaalanlarında gezinme." },
            health: { label: "Sağlık & Zindelik", desc: "Yaygın hastalıklar, vücut parçaları ve egzersiz." },
            shopping: { label: "Alışveriş", desc: "Giyim, bedenler, fiyatlar ve iadeler." }
        },
        business: {
            title: "Mesleki & İş İngilizcesi",
            description: "Kariyer ilerlemesi için İngilizce kullanan öğrenciler için gereklidir.",
            office: { label: "Ofis", desc: "Kırtasiye, teknoloji ve hiyerarşi." },
            meetings: { label: "Toplantılar & Sunumlar", desc: "Deyimler, geçiş ifadeleri ve kurumsal dil." },
            finance: { label: "Müzakere & Finans", desc: "Sözleşmeler, bankacılık ve piyasa eğilimleri." },
            job: { label: "İş Arama", desc: "Özgeçmiş anahtar kelimeleri, mülakat fiilleri ve sosyal beceriler." }
        },
        communication: {
            title: "İletişim & Sosyalleşme",
            description: "Konuşmaları bir arada tutan 'yapıştırıcı'ya odaklanır.",
            phrasal: { label: "Deyimsel Fiiller", desc: "Parçacık veya eyleme göre gruplandırılmış." },
            idioms: { label: "Yaygın Deyimler", desc: "Günlük İngilizcede mecazi dil." },
            social: { label: "Sosyalleşme", desc: "Selamlamalar, havadan sudan konuşma ve kibar ifadeler." },
            emotions: { label: "Duygular & Görüşler", desc: "Duyguları tanımlama ve anlaşmayı ifade etme." }
        },
        academic: {
            title: "Akademik & Teknik",
            description: "TOEFL veya IELTS gibi sınavlara hazırlanan öğrenciler için.",
            science: { label: "Bilim & Teknoloji", desc: "Biyoloji, kimya ve BT terminolojisi." },
            env: { label: "Çevre & Doğa", desc: "İklim değişikliği, coğrafya ve hayvanlar." },
            arts: { label: "Sanatlar", desc: "Edebiyat, müzik, film ve yaratıcı ifade." },
            edu: { label: "Eğitim", desc: "Üniversite hayatı, dersler ve çalışma alışkanlıkları." }
        },
        grammar: {
            title: "Dilbilgisi Tabanlı Kelime Dağarcığı",
            description: "Kelimeleri dilbilgisel rollerine göre öğrenme.",
            temporal: { label: "Zaman Kelimeleri", desc: "Sıklık zarfları ve zaman belirteçleri." },
            connectors: { label: "Bağlaçlar", desc: "Karmaşık cümleler kurma." },
            collocations: { label: "Eşdizimler", desc: "Doğal olarak birlikte giden kelimeler." }
        }
    }
};

const fileNames = fs.readdirSync(localesDir);

fileNames.forEach(fileName => {
    const langCode = path.basename(fileName, '.json');

    // Skip if no translation data available or if it's English (source)
    if (!topicTranslations[langCode] || langCode === 'en') {
        console.log(`Skipping ${fileName}`);
        return;
    }

    const filePath = path.join(localesDir, fileName);

    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const jsonContent = JSON.parse(fileContent);

        // Update topics section
        jsonContent.topics = topicTranslations[langCode];

        fs.writeFileSync(filePath, JSON.stringify(jsonContent, null, 4));
        console.log(`Updated ${fileName} with translated topics`);
    } catch (error) {
        console.error(`Error updating ${fileName}:`, error);
    }
});
