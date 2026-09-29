import { ReportSectionsData } from './HODManualReportBuilder';

export const getDepartmentSampleData = (deptName: string): ReportSectionsData => {
  const dept = deptName.toLowerCase();

  // 1. COMPUTER SCIENCE & ENGINEERING
  if (dept.includes('computer')) {
    return {
      journals: [
        {
          title: 'Deep Transfer Learning Architecture for Automated Early Detection of Retinal Pathologies in Fundus Imagery',
          authors: 'Dr. Kethineni Vinod Kumar, Dr. P. Ramanathan',
          journalName: 'IEEE Transactions on Artificial Intelligence in Medicine',
          issnIsbn: '2691-4581',
          volIssueYear: '15/3',
          pageNos: '112-126',
          indexedIn: 'IEEE / SCI / Scopus',
          link: 'https://doi.org/10.1109/TAIM.2026.3129482'
        },
        {
          title: 'Federated Edge Learning with Differential Privacy Guarantees for Autonomous Vehicular Ad-Hoc Networks',
          authors: 'Er. M. Sateesh, Dr. Kethineni Vinod Kumar',
          journalName: 'ACM Transactions on Cyber-Physical Systems',
          issnIsbn: '2378-962X',
          volIssueYear: '10/2',
          pageNos: '45-61',
          indexedIn: 'ACM / Scopus',
          link: 'https://doi.org/10.1145/3641209'
        }
      ],
      conferences: [
        {
          title: 'Zero-Knowledge Proof Based Authentication Protocol for Decentralized Multi-Cloud Identity Management',
          authors: 'Dr. Kethineni Vinod Kumar, K. Likhitha',
          conferenceName: 'IEEE International Conference on Cloud Computing (IEEE CLOUD 2026)',
          date: '28th April 2026',
          locationMode: 'San Diego, USA (Hybrid)',
          indexedIn: 'IEEE Xplore',
          link: 'https://ieee-cloud2026.org/proceedings/cse-019'
        },
        {
          title: 'Benchmarking LLM Hallucination Mitigation Techniques in Biomedical Clinical Summarization',
          authors: 'Er. C. Harika, Dr. Kethineni Vinod Kumar',
          conferenceName: 'International Conference on Machine Learning & Natural Language (ICMLNL 2026)',
          date: '12th April 2026',
          locationMode: 'Hyderabad, India (In-Person)',
          indexedIn: 'Springer LNCS',
          link: 'https://springer.com/conf/icmlnl2026/paper77'
        }
      ],
      patents: [
        {
          title: 'Decentralized Blockchain-Enabled Dynamic Consensus Architecture for Secure Electronic Health Records',
          inventors: 'Dr. Kethineni Vinod Kumar, Er. M. Sateesh',
          applicants: 'Sanskrithi School of Engineering',
          patentNumber: '202641029184 A',
          status: 'Published',
          awardedDate: '08/04/2026',
          link: 'https://ipindiaservices.gov.in/publicsearch'
        },
        {
          title: 'Autonomous Low-Latency Drone Navigation System Using Edge Spiking Neural Networks',
          inventors: 'Dr. Kethineni Vinod Kumar, Dr. V. Annapurna',
          applicants: 'Sanskrithi School of Engineering',
          patentNumber: '202541088219 B',
          status: 'Awarded / Granted',
          awardedDate: '02/04/2026',
          link: 'https://ipindiaservices.gov.in/patents'
        }
      ],
      entrepreneurship: [
        {
          title: 'Smart Campus AI & GenAI Hackathon: Building Generative Assistance for Students',
          date: '06/04/2026',
          type: '48-Hour Hackathon & Product Sprint',
          participants: '120 Students (30 Teams) & 6 Industry Mentors',
          organizedBy: 'CSE Innovation Cell & Microsoft Learn Chapter',
          mode: 'SSE Advanced Computing Lab',
          keyOutcomes: '4 MVP prototypes developed; 2 teams selected for NASSCOM incubator seed funding',
          participantsCount: '120',
          mentorCoordinator: 'Dr. Kethineni Vinod Kumar',
          status: 'Completed',
          link: 'https://sseptp.org/cse/hackathon-2026'
        },
        {
          title: 'Web3 & Decentralized App Incubation Pitch for FinTech Solutions',
          date: '18/04/2026',
          type: 'Incubation Pitch & VC Demo Day',
          participants: '45 Final-Year CSE Students',
          organizedBy: 'Department EDC Hub',
          mode: 'Hybrid (Zoom & Seminar Hall)',
          keyOutcomes: '1 student start-up (ChainGuard AI) secured angel funding commitment of Rs. 2 Lakhs',
          participantsCount: '45',
          mentorCoordinator: 'Er. M. Sateesh',
          status: 'Incubated',
          link: 'https://sseptp.org/edc/web3-pitch'
        }
      ],
      nss: [
        {
          event: 'Rural Digital Literacy & Cyber Safety Awareness Campaign in Government Schools',
          date: '11/04/2026',
          venue: 'Zilla Parishad High School, Beedupalli',
          type: 'Community Extension & Digital Empowerment',
          participantsCount: '65 Student Volunteers',
          typeOfParticipants: 'CSE II & III Year Volunteers',
          outcomes: 'Trained 180 rural high school students on cyber scam awareness, UPI security, and basic coding',
          coordinator: 'Mr. R. Naresh & Er. C. Harika',
          link: 'https://sseptp.org/nss/digital-literacy-2026'
        },
        {
          event: 'E-Waste Segregation and Responsible Recycling Drive',
          date: '22/04/2026',
          venue: 'SSE Knowledge Park Campus',
          type: 'Environmental Sustainability',
          participantsCount: '50 Volunteers',
          typeOfParticipants: 'CSE Student Association',
          outcomes: 'Collected 210 kg of obsolete computer peripherals and handed over to certified green recycler',
          coordinator: 'Er. P. Rajesh',
          link: 'https://sseptp.org/nss/ewaste-drive'
        }
      ],
      fdpAttended: [
        {
          title: 'AICTE ATAL FDP on Cloud-Native Microservices Architecture with Kubernetes & Docker',
          type: 'FDP',
          dates: '07/04/2026 to 11/04/2026',
          organizingBody: 'NIT Warangal',
          mode: 'Online',
          facultyAttended: 'Dr. Kethineni Vinod Kumar, Er. M. Sateesh',
          link: 'https://atalacademy.aicte-india.org/cert/cse-warangal-481'
        }
      ],
      fdpOrganized: [
        {
          title: 'One-Week National Level FDP on Generative AI, LLMOps and Foundation Models in Production',
          type: 'FDP',
          dates: '13/04/2026 to 18/04/2026',
          deptOrganized: 'Computer Science & Engineering',
          mode: 'Hybrid',
          resourcePersonDetails: 'Dr. P. Ramanathan, Principal AI Scientist, NVIDIA India, Bengaluru, Karnataka - 560045',
          facultyCoordinators: 'Dr. Kethineni Vinod Kumar, Er. C. Harika',
          link: 'https://iith.ac.in/fdp/cse-genai-2026'
        }
      ],
      fdp: [
        {
          title: 'One-Week National Level FDP on Generative AI, LLMOps and Foundation Models in Production',
          type: 'National Level FDP',
          dates: '13/04/2026 to 18/04/2026',
          organizingBody: 'IIT Hyderabad & SSE Department of CSE',
          mode: 'Hybrid Mode',
          role: 'Organizing Chair & Participant',
          keyOutcomes: 'Faculty mastered fine-tuning LLaMA-3 models, LangChain agent workflows, and vector databases',
          link: 'https://iith.ac.in/fdp/cse-genai-2026'
        },
        {
          title: 'AICTE ATAL FDP on Cloud-Native Microservices Architecture with Kubernetes & Docker',
          type: 'AICTE ATAL Sponsored',
          dates: '07/04/2026 to 11/04/2026',
          organizingBody: 'NIT Warangal',
          mode: 'Online Mode',
          role: 'Participant',
          keyOutcomes: 'Trained on production container orchestration, CI/CD pipeline automation, and service mesh',
          link: 'https://atalacademy.aicte-india.org/cert/cse-warangal-481'
        }
      ],
      sdp: [
        {
          title: 'Full-Stack Web Development Mastery: MERN Stack & Next.js 14 Hands-on Bootcamp',
          date: '15/04/2026 to 17/04/2026',
          type: 'Hands-on SDP Certification',
          resourcePerson: 'Mr. K. Anirudh (Senior Software Architect, Atlassian)',
          mode: 'SSE Computer Center - 3',
          keyOutcomes: '85 students built and deployed live e-commerce portals on Vercel with MongoDB Atlas',
          participantsCount: '85',
          coordinator: 'Dr. Kethineni Vinod Kumar',
          link: 'https://sseptp.org/sdp/fullstack-mern-2026'
        },
        {
          title: 'Hands-on Cyber Security & Ethical Hacking Crash Course on Penetration Testing',
          date: '24/04/2026',
          type: 'Skill Development Workshop',
          resourcePerson: 'Mr. V. Sandeep (Certified Ethical Hacker & Security Analyst, CyberDef)',
          mode: 'Offline Hands-on Lab',
          keyOutcomes: '65 students practiced vulnerability assessment using Kali Linux, Wireshark, and Burp Suite',
          participantsCount: '65',
          coordinator: 'Er. M. Sateesh',
          link: 'https://sseptp.org/sdp/cybersec-workshop'
        }
      ],
      facultyAchievements: [
        {
          name: 'Dr. Kethineni Vinod Kumar',
          award: 'Distinguished AI Researcher & Educator of the Year Award',
          organization: 'Computer Society of India (CSI) - AP State Chapter',
          date: '19/04/2026',
          link: 'https://csi-india.org/awards-2026'
        },
        {
          name: 'Er. C. Harika',
          award: 'Best Technical Paper Award in Natural Language Processing',
          organization: 'International Conference on Smart Computing (ICSC 2026)',
          date: '08/04/2026',
          link: 'https://icsc2026.org/nlp-award'
        }
      ],
      studentAchievements: [
        {
          nameRoll: 'Y. Sai Charan (22SSE1A0582) & Team Alpha',
          award: '1st Prize & Rs. 1,00,000 Cash Award in Smart India Hackathon (SIH 2026)',
          event: 'Smart India Hackathon 2026 Grand Finale',
          organization: 'Ministry of Education (MoE) & AICTE',
          durationDate: '15/04/2026 to 16/04/2026',
          link: 'https://sih.gov.in/winners-2026'
        },
        {
          nameRoll: 'K. Divya (23SSE1A0539)',
          award: 'Gold Medal in State-Level Coding Olympiad & AlgoSprint',
          event: 'CodeKshatra 2026',
          organization: 'JNTU Anantapur',
          durationDate: '21/04/2026',
          link: 'https://jntua.ac.in/events/codekshatra'
        }
      ],
      certifications: [
        {
          title: 'AWS Certified Solutions Architect - Associate',
          type: 'Global Cloud Certification',
          duration: '8 Weeks Training',
          platform: 'Amazon Web Services (AWS) Academy',
          enrolled: '55',
          certified: '48 Certified',
          keyOutcomes: 'Validated high-availability infrastructure design on AWS Cloud',
          link: 'https://aws.amazon.com/verification'
        },
        {
          title: 'Google Cloud Professional Data Engineer Certification',
          type: 'Industry Certification',
          duration: '10 Weeks',
          platform: 'Google Cloud Skills Boost',
          enrolled: '32',
          certified: '29 Certified',
          keyOutcomes: 'Mastered BigQuery, Dataflow streaming pipelines, and Cloud Dataproc',
          link: 'https://googlecloud.credential.net/verify'
        },
        {
          title: 'Deep Learning Specialization with PyTorch & TensorFlow',
          type: 'DeepLearning.AI Professional Certificate',
          duration: '12 Weeks',
          platform: 'Coursera / DeepLearning.AI',
          enrolled: '60',
          certified: '54 Certified',
          keyOutcomes: 'Implemented Convolutional Networks, Transformers, and GANs',
          link: 'https://coursera.org/verify/specialization/deeplearning'
        }
      ],
      deptMeetings: [
        {
          date: '04.04.2026',
          decisions: 'Review of Capstone Project external viva schedule, allocation of faculty mentors for Smart India Hackathon, and academic audit of lab records.',
          policyChanges: 'Mandatory Git repository submission and automated code quality linting for all major projects.',
          link: 'https://sseptp.org/iqac/cse/minutes-04-04-2026'
        },
        {
          date: '20.04.2026',
          decisions: 'Analysis of Mid-term examinations, syllabus coverage review across all 4 years, and organization of CYBERKSHETRA 2026 annual symposium.',
          policyChanges: 'Minimum 90% attendance mandatory for appearing in pre-final lab practical exams.',
          link: 'https://sseptp.org/iqac/cse/minutes-20-04-2026'
        }
      ],
      mous: [
        {
          name: 'Infosys Springboard & SSE Department of Computer Science & Engineering',
          purpose: 'Digital Learning Curriculum, Industry Live Projects, Faculty Enablement, and Campus Placement Support',
          datePeriod: 'Valid 2024 to 2027 (3 Years)',
          facultySpoc: 'Dr. Kethineni Vinod Kumar (HOD - CSE)',
          link: 'https://sseptp.org/mou/infosys-springboard'
        },
        {
          name: 'Red Hat Academy Center of Excellence',
          purpose: 'Red Hat Enterprise Linux (RHEL) Certification, OpenShift Cloud Native Lab, and Student Apprenticeship',
          datePeriod: 'Valid 2025 to 2028 (3 Years)',
          facultySpoc: 'Er. M. Sateesh (Assistant Professor - CSE)',
          link: 'https://sseptp.org/mou/redhat-academy'
        }
      ],
      additionalInitiatives: [
        {
          initiative: '24/7 Competitive Coding Club & LeetCode Student Leaderboard',
          date: '02/04/2026',
          description: 'Department launched daily automated coding challenges with weekly faculty reviews on data structures & algorithms.',
          outcomes: 'Over 240 active student participants; average problem-solving score improved by 35%.',
          coordinator: 'Er. C. Harika',
          link: 'https://sseptp.org/cse/coding-club'
        },
        {
          initiative: 'Open Source Software Contribution Sprint for Linux Kernel & Apache Projects',
          date: '16/04/2026',
          description: 'Weekend sprint guiding students through Git pull requests, open-source documentation, and code reviews.',
          outcomes: '12 student pull requests merged into public open-source repositories.',
          coordinator: 'Er. P. Rajesh',
          link: 'https://sseptp.org/cse/opensource-sprint'
        }
      ],
      techAssociation: [
        {
          event: 'CYBERKSHETRA 2026 - Annual National Technical Symposium & Hack-Fest',
          date: '23/04/2026',
          type: 'Technical Association Mega Event',
          resourcePersonCoordinator: 'Mr. T. Srinivas (VP of Engineering, Cognizant)',
          participants: '220 Students across 12 Engineering Institutions',
          outcomes: 'Conducted live bug-hunting tournament, paper presentations, and algorithmic coding championship.',
          link: 'https://sseptp.org/associations/cyberkshetra-2026'
        },
        {
          event: 'Masterclass on Cloud Microservices & Scalable System Design',
          date: '10/04/2026',
          type: 'Expert Industry Guest Lecture',
          resourcePersonCoordinator: 'Mr. R. Karthik (Lead Architect, Salesforce India)',
          participants: '135 CSE III & IV Year Students',
          outcomes: 'In-depth architectural analysis of distributed caching, Kafka event streaming, and sharding.',
          link: 'https://sseptp.org/associations/guest-lecture-microservices'
        }
      ],
      iicCell: [
        {
          activity: 'GenAI & Cloud Innovation Pitch Sprint for Smart Governance Applications',
          date: '14/04/2026',
          description: 'Under IIC 6.0, students pitched AI solutions for public grievances and crop disease surveillance.',
          partner: 'Telangana & AP State Innovation Cell (TSIC & APSDMA)',
          beneficiaries: '90 Engineering Students & 12 Faculty Mentors',
          outcomes: '3 student innovations selected for state incubation mentorship.',
          link: 'https://mic.gov.in/iic/sse-cse-genai-pitch'
        },
        {
          activity: 'Workshop on Patent Search & Software Copyright Drafting for Computer Innovations',
          date: '25/04/2026',
          description: 'Practical training on novelty claims for algorithmic inventions and Indian Patent Office software guidelines.',
          partner: 'National Institute of Intellectual Property Management (NIIPM)',
          beneficiaries: '70 Students & 18 Faculty Members',
          outcomes: '5 software invention disclosure forms (IDFs) cleared for provisional patent filing.',
          link: 'https://mic.gov.in/iic/software-ipr-workshop'
        }
      ],
      syllabus: [
        {
          subject: 'Operating Systems & System Programming',
          yearSem: 'II B.Tech II Sem',
          faculty: 'Dr. Kethineni Vinod Kumar',
          completed: '100%',
          pending: 'Nil',
          remarks: 'Syllabus completed; Linux shell scripting lab exercises verified.'
        },
        {
          subject: 'Design and Analysis of Algorithms',
          yearSem: 'II B.Tech II Sem',
          faculty: 'Er. M. Sateesh',
          completed: '95%',
          pending: '5%',
          remarks: 'NP-Completeness and approximation algorithms unit in progress; remedial classes scheduled.'
        },
        {
          subject: 'Machine Learning & Deep Neural Networks',
          yearSem: 'III B.Tech II Sem',
          faculty: 'Er. C. Harika',
          completed: '100%',
          pending: 'Nil',
          remarks: 'Completed. Hands-on PyTorch model training and model question bank shared.'
        },
        {
          subject: 'Compiler Design & Automata Theory',
          yearSem: 'III B.Tech II Sem',
          faculty: 'Er. P. Rajesh',
          completed: '92%',
          pending: '8%',
          remarks: 'Code optimization and code generation modules concluding this week.'
        }
      ]
    };
  }

  // 2. ELECTRONICS & COMMUNICATION ENGINEERING
  if (dept.includes('communication') || dept.includes('electronics')) {
    return {
      journals: [
        {
          title: 'Design of Compact Triple-Band Reconfigurable MIMO Antenna for Sub-6 GHz 5G and V2X Communications',
          authors: 'Dr. V. Annapurna, Er. K. Ramesh',
          journalName: 'IEEE Antennas and Wireless Propagation Letters',
          issnIsbn: '1536-1225',
          volIssueYear: '23/4',
          pageNos: '780-784',
          indexedIn: 'IEEE / SCI / Scopus',
          link: 'https://doi.org/10.1109/LAWP.2026.3190284'
        },
        {
          title: 'Low-Power High-Throughput Approximate Multiplier Architecture for Edge AI Vision Processors in 28nm CMOS',
          authors: 'Dr. V. Annapurna, Er. B. Madhavi',
          journalName: 'Integration, the VLSI Journal (Elsevier)',
          issnIsbn: '0167-9260',
          volIssueYear: '88',
          pageNos: '102-114',
          indexedIn: 'Elsevier / Scopus',
          link: 'https://doi.org/10.1016/j.vlsi.2026.102114'
        }
      ],
      conferences: [
        {
          title: 'FPGA Implementation of Hardware-Accelerated Convolutional Filter for Real-Time Biomedical Signal Denoising',
          authors: 'Dr. V. Annapurna, T. Akhila',
          conferenceName: 'International Conference on VLSI Design (VLSID 2026)',
          date: '10th April 2026',
          locationMode: 'Bengaluru, India',
          indexedIn: 'IEEE Xplore',
          link: 'https://vlsiconference.org/papers/ece-441'
        },
        {
          title: 'Beamforming Optimization in Millimeter-Wave Massive MIMO Networks Using Deep Reinforcement Learning',
          authors: 'Er. K. Ramesh, Dr. V. Annapurna',
          conferenceName: 'IEEE International Conference on Communications & Signal Processing (ICCSP 2026)',
          date: '21st April 2026',
          locationMode: 'Chennai, India (Hybrid)',
          indexedIn: 'IEEE Xplore',
          link: 'https://iccsp2026.org/proceedings/ece-92'
        }
      ],
      patents: [
        {
          title: 'Wearable Multi-Frequency Textile Antenna Patch for Continuous Non-Invasive Physiological Monitoring',
          inventors: 'Dr. V. Annapurna, Er. B. Madhavi',
          applicants: 'Sanskrithi School of Engineering',
          patentNumber: '202641031209 A',
          status: 'Published',
          awardedDate: '09/04/2026',
          link: 'https://ipindiaservices.gov.in/publicsearch'
        },
        {
          title: 'Low-Latency Neuromorphic Sensory Interface Device for Autonomous Agricultural Robotics',
          inventors: 'Dr. V. Annapurna, Dr. Kethineni Vinod Kumar',
          applicants: 'Sanskrithi School of Engineering',
          patentNumber: '202541077182 B',
          status: 'Awarded / Granted',
          awardedDate: '01/04/2026',
          link: 'https://ipindiaservices.gov.in/patents'
        }
      ],
      entrepreneurship: [
        {
          title: 'Hardware Hackathon: Drone Avionics & Embedded IoT Sensing for Precision Agriculture',
          date: '09/04/2026',
          type: 'Hardware Prototyping Hackathon',
          participants: '75 Students (18 Teams) & 4 Industry Mentors',
          organizedBy: 'Texas Instruments Innovation Center & ECE Dept',
          mode: 'SSE Embedded Systems Lab',
          keyOutcomes: '3 hardware prototypes constructed; 1 team shortlisted for T-Hub hardware grant',
          participantsCount: '75',
          mentorCoordinator: 'Dr. V. Annapurna',
          status: 'Completed',
          link: 'https://sseptp.org/ece/hardware-hackathon'
        },
        {
          title: 'Start-up Pitch on Solar-Powered LoRaWAN Nodes for Rural Water Tank Monitoring',
          date: '19/04/2026',
          type: 'Product Demonstration & Incubation',
          participants: '32 Final Year ECE Students',
          organizedBy: 'EDC Cell ECE Chapter',
          mode: 'Offline Seminar Hall',
          keyOutcomes: 'Prototype successfully field-tested in Beedupalli water reservoir',
          participantsCount: '32',
          mentorCoordinator: 'Er. K. Ramesh',
          status: 'Incubated',
          link: 'https://sseptp.org/edc/lora-sensing'
        }
      ],
      nss: [
        {
          event: 'Solar Lantern Assembly & Clean Green Energy Distribution Drive for Rural Households',
          date: '13/04/2026',
          venue: 'Nagireddypalli Tribal Hamlet',
          type: 'Extension & Sustainable Technology Outreach',
          participantsCount: '48 Volunteers',
          typeOfParticipants: 'ECE II & III Year Students',
          outcomes: 'Assembled and distributed 40 solar emergency LED lanterns to families without continuous grid power',
          coordinator: 'Er. G. Prasad & Mr. R. Naresh',
          link: 'https://sseptp.org/nss/solar-lantern-drive'
        },
        {
          event: 'Electronic Waste Disposal Awareness & Free Home Appliance Repair Camp',
          date: '25/04/2026',
          venue: 'Kothacheruvu Community Center',
          type: 'Community Service & Technical Skill Outreach',
          participantsCount: '35 Student Technicians',
          typeOfParticipants: 'ECE Final Year Students',
          outcomes: 'Repaired 52 non-functional domestic electronic appliances free of cost for local villagers',
          coordinator: 'Er. B. Madhavi',
          link: 'https://sseptp.org/nss/appliance-repair-camp'
        }
      ],
      fdpAttended: [
        {
          title: 'AICTE ATAL FDP on 5G/6G Wireless Physical Layer Design and SDR Prototyping',
          type: 'FDP',
          dates: '06/04/2026 to 10/04/2026',
          organizingBody: 'NIT Calicut',
          mode: 'Online',
          facultyAttended: 'Dr. V. Annapurna, Er. B. Madhavi',
          link: 'https://atalacademy.aicte-india.org/cert/ece-calicut-901'
        }
      ],
      fdpOrganized: [
        {
          title: 'One-Week National Level FDP on RISC-V Architecture & Open-Source Silicon Design Flow',
          type: 'FDP',
          dates: '14/04/2026 to 19/04/2026',
          deptOrganized: 'Electronics & Communication Engineering',
          mode: 'Hybrid',
          resourcePersonDetails: 'Dr. S. Ramakrishna, Lead Silicon Architect, Intel India, Bengaluru, Karnataka - 560103',
          facultyCoordinators: 'Dr. V. Annapurna, Er. K. Naresh',
          link: 'https://iitm.ac.in/fdp/riscv-2026'
        }
      ],
      fdp: [
        {
          title: 'One-Week National Level FDP on RISC-V Architecture & Open-Source Silicon Design Flow',
          type: 'National Level FDP',
          dates: '14/04/2026 to 19/04/2026',
          organizingBody: 'IIT Madras & SSE Department of ECE',
          mode: 'Hybrid Mode',
          role: 'Convener & Participant',
          keyOutcomes: 'Faculty gained expertise in OpenLane ASIC toolchain, Verilog verification, and tape-out readiness',
          link: 'https://iitm.ac.in/fdp/riscv-2026'
        },
        {
          title: 'AICTE ATAL FDP on 5G/6G Wireless Physical Layer Design and SDR Prototyping',
          type: 'AICTE ATAL Sponsored',
          dates: '06/04/2026 to 10/04/2026',
          organizingBody: 'NIT Calicut',
          mode: 'Online Mode',
          role: 'Participant',
          keyOutcomes: 'Hands-on simulation using USRP Software Defined Radios and GNU Radio toolkits',
          link: 'https://atalacademy.aicte-india.org/cert/ece-calicut-901'
        }
      ],
      sdp: [
        {
          title: 'Hands-on Skill Certification on ARM Cortex-M4 Embedded C & FreeRTOS Architecture',
          date: '16/04/2026 to 18/04/2026',
          type: 'Technical SDP Certification',
          resourcePerson: 'Er. N. Bharath (Senior Firmware Architect, Qualcomm India)',
          mode: 'SSE Advanced Embedded Lab',
          keyOutcomes: '65 students developed real-time task scheduling and peripheral driver modules',
          participantsCount: '65',
          coordinator: 'Dr. V. Annapurna',
          link: 'https://sseptp.org/sdp/arm-freertos-2026'
        },
        {
          title: 'Masterclass on Multilayer High-Speed PCB Layout Design using Altium Designer',
          date: '22/04/2026',
          type: 'Hands-on Industrial SDP',
          resourcePerson: 'Er. T. Manoj (Senior Hardware Designer, Bosch India)',
          mode: 'SSE CAD / VLSI Center',
          keyOutcomes: '50 students routed 4-layer impedance-matched boards for RF transceiver circuits',
          participantsCount: '50',
          coordinator: 'Er. K. Ramesh',
          link: 'https://sseptp.org/sdp/pcb-altium'
        }
      ],
      facultyAchievements: [
        {
          name: 'Dr. V. Annapurna',
          award: 'IETE Best Research Paper Gold Medal in RF & Microwave Engineering',
          organization: 'Institution of Electronics and Telecommunication Engineers (IETE)',
          date: '17/04/2026',
          link: 'https://iete.org/awards/2026'
        },
        {
          name: 'Er. B. Madhavi',
          award: 'Outstanding Woman Engineer in VLSI Innovation Award',
          organization: 'IEEE Women in Engineering (WIE) - Hyderabad Section',
          date: '07/04/2026',
          link: 'https://ieee-wie.org/awards-2026'
        }
      ],
      studentAchievements: [
        {
          nameRoll: 'P. Sai Teja (22SSE1A0441) & M. Bhavana (22SSE1A0419)',
          award: '1st Prize & Rs. 50,000 Cash in Texas Instruments India Innovation Design Challenge',
          event: 'TI National Innovation Challenge 2026',
          organization: 'Texas Instruments India & AICTE',
          durationDate: '11/04/2026 to 12/04/2026',
          link: 'https://ti.com/indiachallenge/winners2026'
        },
        {
          nameRoll: 'K. Sneha (23SSE1A0467)',
          award: '2nd Prize in National Level Embedded Circuit Bug-Hunt Competition',
          event: 'ELECTROKRITHI 2026',
          organization: 'NIT Rourkela',
          durationDate: '19/04/2026',
          link: 'https://nitrkl.ac.in/electrokrithi/results'
        }
      ],
      certifications: [
        {
          title: 'VLSI System on Chip (SoC) Design & Verification',
          type: 'NPTEL-AICTE FDP Certification',
          duration: '12 Weeks',
          platform: 'SWAYAM / NPTEL (IIT Kharagpur)',
          enrolled: '45',
          certified: '41 Certified (14 with Elite Silver)',
          keyOutcomes: 'Mastered SystemVerilog, UVM testbench architecture, and functional coverage',
          link: 'https://nptel.ac.in/noc/Ecertificate/?q=NPTEL26EC14'
        },
        {
          title: 'Embedded Systems & Industrial IoT Architecture',
          type: 'Industry Credential',
          duration: '8 Weeks',
          platform: 'Texas Instruments Education Online',
          enrolled: '50',
          certified: '46 Certified',
          keyOutcomes: 'Programmed CC3200 WiFi microcontrollers and MQTT cloud gateways',
          link: 'https://ti.com/cert/embed-2026'
        },
        {
          title: 'Digital Signal Processing with MATLAB & Simulink',
          type: 'MathWorks Certified Specialist',
          duration: '6 Weeks',
          platform: 'MathWorks Training Portal',
          enrolled: '35',
          certified: '33 Certified',
          keyOutcomes: 'Implemented FIR/IIR digital filter structures and spectral analysis',
          link: 'https://mathworks.com/verify/cert/dsp-2026'
        }
      ],
      deptMeetings: [
        {
          date: '02.04.2026',
          decisions: 'Review of Texas Instruments Innovation Lab procurement, major project evaluation rubrics, and NAAC Criterion 2 documentation.',
          policyChanges: 'Mandatory hardware working prototype demonstration required for final year mini-projects.',
          link: 'https://sseptp.org/iqac/ece/minutes-02-04-2026'
        },
        {
          date: '18.04.2026',
          decisions: 'Mid-term evaluation results review, syllabus completion tracking, and scheduling of ELECTROFEST 2026 technical association events.',
          policyChanges: 'Allocation of extra 2 hours of lab time weekly for students working on competitive hardware challenges.',
          link: 'https://sseptp.org/iqac/ece/minutes-18-04-2026'
        }
      ],
      mous: [
        {
          name: 'Texas Instruments University Program & SSE Department of ECE',
          purpose: 'Establishment of Advanced MCU & Embedded IoT Lab, Industrial Training, and Student Hardware Project Funding',
          datePeriod: 'Valid 2024 to 2027 (3 Years)',
          facultySpoc: 'Dr. V. Annapurna (HOD - ECE)',
          link: 'https://sseptp.org/mou/texas-instruments'
        },
        {
          name: 'Cadence Design Systems Academic Network',
          purpose: 'VLSI EDA Software Licenses, Custom IC Design Flow Training, and Student Placement Enablement',
          datePeriod: 'Valid 2025 to 2028 (3 Years)',
          facultySpoc: 'Er. B. Madhavi (Assistant Professor - ECE)',
          link: 'https://sseptp.org/mou/cadence-network'
        }
      ],
      additionalInitiatives: [
        {
          initiative: 'Open Hardware Innovation & IoT Tinkering Hub',
          date: '05/04/2026',
          description: 'Established a 24/7 maker space equipped with digital oscilloscopes, soldering stations, and 3D printer for electronics hobbyists.',
          outcomes: 'Over 110 students actively prototyping robotics and sensor boards.',
          coordinator: 'Er. G. Prasad',
          link: 'https://sseptp.org/ece/tinkering-hub'
        },
        {
          initiative: 'Peer-to-Peer Circuit Debugging & PCB Soldering Clinic',
          date: '15/04/2026',
          description: 'Weekly clinic where senior students mentor juniors on SMD soldering techniques and breadboard troubleshooting.',
          outcomes: 'Trained 45 second-year students in surface-mount soldering.',
          coordinator: 'Er. B. Madhavi',
          link: 'https://sseptp.org/ece/soldering-clinic'
        }
      ],
      techAssociation: [
        {
          event: 'ELECTROKRITHI 2026 - National Level Technical Symposium & Project Expo',
          date: '21/04/2026',
          type: 'Technical Association Mega Event',
          resourcePersonCoordinator: 'Mr. K. V. Sharma (Director of Engineering, BSNL Telecom)',
          participants: '180 Students across 9 Engineering Institutions',
          outcomes: 'Conducted circuit debugging challenge, technical paper presentations, and robotics track race.',
          link: 'https://sseptp.org/associations/electrokrithi-2026'
        },
        {
          event: 'Guest Lecture on Next-Generation 6G Wireless Networks & Terahertz Communication',
          date: '11/04/2026',
          type: 'Distinguished Technical Lecture',
          resourcePersonCoordinator: 'Dr. S. Radhakrishna (Senior Scientist, ISRO Satellite Centre)',
          participants: '110 ECE III & IV Year Students',
          outcomes: 'Gained insights into reconfigurable intelligent surfaces (RIS) and satellite ground station antennas.',
          link: 'https://sseptp.org/associations/guest-lecture-6g'
        }
      ],
      iicCell: [
        {
          activity: 'Idea Pitch on Low-Power IoT Environmental Warning Systems for Flash Floods',
          date: '15/04/2026',
          description: 'Under IIC 6.0, students demonstrated ultrasonic water level telemetry devices for rural causeways.',
          partner: 'AP State Disaster Management Authority & C-DAC Hyderabad',
          beneficiaries: '65 Engineering Students & 8 Local Volunteers',
          outcomes: '2 hardware prototypes shortlisted for smart village deployment funding.',
          link: 'https://mic.gov.in/iic/sse-ece-iot-pitch'
        },
        {
          activity: 'Hands-on Patent Drafting Clinic for Embedded Electronics & Chip Architecture',
          date: '26/04/2026',
          description: 'Practical session on drafting circuit claims, block diagrams, and hardware patent disclosures.',
          partner: 'National Research Development Corporation (NRDC)',
          beneficiaries: '50 Students & 12 Faculty Members',
          outcomes: '3 hardware patent specifications completed for provisional registration.',
          link: 'https://mic.gov.in/iic/ece-patent-clinic'
        }
      ],
      syllabus: [
        {
          subject: 'Digital Signal Processing & Applications',
          yearSem: 'III B.Tech II Sem',
          faculty: 'Dr. V. Annapurna',
          completed: '100%',
          pending: 'Nil',
          remarks: 'Completed. FFT algorithms, digital filter design, and MATLAB simulations verified.'
        },
        {
          subject: 'VLSI Design & Technology',
          yearSem: 'III B.Tech II Sem',
          faculty: 'Er. B. Madhavi',
          completed: '95%',
          pending: '5%',
          remarks: 'CMOS subsystem design and stick diagrams concluding; revision scheduled.'
        },
        {
          subject: 'Microprocessors and Microcontrollers (8086 / ARM)',
          yearSem: 'II B.Tech II Sem',
          faculty: 'Er. K. Ramesh',
          completed: '92%',
          pending: '8%',
          remarks: 'ARM interrupt handling and timer configuration concluding this week.'
        },
        {
          subject: 'Antennas and Wave Propagation',
          yearSem: 'III B.Tech II Sem',
          faculty: 'Er. G. Prasad',
          completed: '100%',
          pending: 'Nil',
          remarks: 'Completed. Microstrip patch antenna and array design question banks shared.'
        }
      ]
    };
  }

  // 3. ELECTRICAL & ELECTRONICS ENGINEERING
  if (dept.includes('electrical')) {
    return {
      journals: [
        {
          title: 'Optimal Energy Management Strategy for Grid-Connected Photovoltaic-Battery Hybrid Electric Vehicle Charging Stations',
          authors: 'Mr. K. Gangadhar, Dr. S. Mallikarjuna',
          journalName: 'IEEE Transactions on Sustainable Energy',
          issnIsbn: '1949-3029',
          volIssueYear: '15/2',
          pageNos: '914-927',
          indexedIn: 'IEEE / SCI / Scopus',
          link: 'https://doi.org/10.1109/TSTE.2026.3188901'
        },
        {
          title: 'Power Quality Enhancement in Distribution Networks Using Modified Unified Power Quality Conditioner (UPQC)',
          authors: 'Mr. K. Gangadhar, Er. D. Surendra',
          journalName: 'International Journal of Electrical Power & Energy Systems (Elsevier)',
          issnIsbn: '0142-0615',
          volIssueYear: '142',
          pageNos: '108-121',
          indexedIn: 'Elsevier / Scopus',
          link: 'https://doi.org/10.1016/j.ijepes.2026.108121'
        }
      ],
      conferences: [
        {
          title: 'Design and Simulation of High-Efficiency Bidirectional DC-DC Converter for Regenerative Braking in Electric Vehicles',
          authors: 'Mr. K. Gangadhar, V. Mahesh',
          conferenceName: 'IEEE International Conference on Power Electronics, Smart Grid and Renewable Energy (PESGRE 2026)',
          date: '16th April 2026',
          locationMode: 'Cochin, India (Hybrid)',
          indexedIn: 'IEEE Xplore',
          link: 'https://pesgre2026.org/papers/eee-219'
        },
        {
          title: 'IoT-Based Microgrid Real-Time Fault Diagnosis Using Wavelet Packet Transform and Machine Learning',
          authors: 'Er. D. Surendra, Mr. K. Gangadhar',
          conferenceName: 'National Power Systems Conference (NPSC 2026)',
          date: '27th April 2026',
          locationMode: 'IIT Roorkee',
          indexedIn: 'Springer Proceedings',
          link: 'https://npsc2026.org/papers/fault-microgrid'
        }
      ],
      patents: [
        {
          title: 'Intelligent Wireless Dynamic Inductive Power Transfer System for Electric Vehicles on Concrete Highways',
          inventors: 'Mr. K. Gangadhar, Dr. S. Mallikarjuna',
          applicants: 'Sanskrithi School of Engineering',
          patentNumber: '202641028711 A',
          status: 'Published',
          awardedDate: '07/04/2026',
          link: 'https://ipindiaservices.gov.in/publicsearch'
        },
        {
          title: 'Microcontroller-Based Smart Solar Inverter with Automated Anti-Islanding and Grid Synchronization',
          inventors: 'Mr. K. Gangadhar, Er. D. Surendra',
          applicants: 'Sanskrithi School of Engineering',
          patentNumber: '202541065192 B',
          status: 'Awarded / Granted',
          awardedDate: '03/04/2026',
          link: 'https://ipindiaservices.gov.in/patents'
        }
      ],
      entrepreneurship: [
        {
          title: 'Solar Rooftop Design & Energy Audit Start-up Boot Camp for Clean Energy Transition',
          date: '07/04/2026',
          type: 'CleanTech Hackathon & Business Plan Sprint',
          participants: '52 Students (12 Teams) & 3 Energy Auditors',
          organizedBy: 'Department EDC Cell & AP Solar Energy Society',
          mode: 'Offline - EEE Seminar Hall',
          keyOutcomes: '2 student venture plans on solar-powered agro-pump retrofitting submitted for MSME incubation',
          participantsCount: '52',
          mentorCoordinator: 'Mr. K. Gangadhar',
          status: 'Completed',
          link: 'https://sseptp.org/eee/solarenergy-bootcamp'
        },
        {
          title: 'Incubation Pitch on Retrofitting Conventional Two-Wheelers into BLDC Electric Mopeds',
          date: '20/04/2026',
          type: 'EV Retrofit Demonstration & Demo Day',
          participants: '30 Final Year EEE Students',
          organizedBy: 'SSE EV Prototyping Hub',
          mode: 'SSE Electrical Machines Lab',
          keyOutcomes: 'Fabricated working 48V/2kW electric moped with 65km range per charge',
          participantsCount: '30',
          mentorCoordinator: 'Er. D. Surendra',
          status: 'Incubated',
          link: 'https://sseptp.org/edc/ev-moped'
        }
      ],
      nss: [
        {
          event: 'Rural Energy Conservation Campaign & Free LED Bulb Distribution Drive',
          date: '12/04/2026',
          venue: 'Kammavaripalli Village',
          type: 'Energy Literacy & Community Welfare',
          participantsCount: '45 Student Volunteers',
          typeOfParticipants: 'EEE II & III Year Students',
          outcomes: 'Distributed 120 energy-efficient LED bulbs and conducted home power wastage audits for 60 families',
          coordinator: 'Mr. R. Naresh & Er. N. Venkatesh',
          link: 'https://sseptp.org/nss/energy-audit-drive'
        },
        {
          event: 'Electrical Safety, Earthing Audits & Safe Wiring Awareness in Rural Primary Schools',
          date: '24/04/2026',
          venue: 'Government Primary Schools, Prasanthigram',
          type: 'Safety & Technical Extension',
          participantsCount: '32 Volunteers',
          typeOfParticipants: 'EEE Students',
          outcomes: 'Tested electrical earthing resistance in 4 school buildings and replaced degraded wiring switches',
          coordinator: 'Er. D. Surendra',
          link: 'https://sseptp.org/nss/electrical-safety-camp'
        }
      ],
      fdpAttended: [
        {
          title: 'AICTE ATAL FDP on Smart Grid Operation, Wide-Area Monitoring & Cyber-Security in SCADA Systems',
          type: 'FDP',
          dates: '06/04/2026 to 10/04/2026',
          organizingBody: 'NIT Surathkal',
          mode: 'Online',
          facultyAttended: 'Mr. K. Gangadhar, Er. D. Surendra',
          link: 'https://atalacademy.aicte-india.org/cert/eee-surathkal-312'
        }
      ],
      fdpOrganized: [
        {
          title: 'One-Week National FDP on Electric Vehicle Powertrain Architecture, BMS & Fast Charging Infrastructure',
          type: 'FDP',
          dates: '13/04/2026 to 18/04/2026',
          deptOrganized: 'Electrical & Electronics Engineering',
          mode: 'Hybrid',
          resourcePersonDetails: 'Dr. V. Rajesh, Head of Power Systems R&D, Schneider Electric, Bengaluru, Karnataka - 560066',
          facultyCoordinators: 'Mr. K. Gangadhar, Er. N. Venkatesh',
          link: 'https://iitd.ac.in/fdp/ev-powertrain-2026'
        }
      ],
      fdp: [
        {
          title: 'One-Week National FDP on Electric Vehicle Powertrain Architecture, BMS & Fast Charging Infrastructure',
          type: 'National Level FDP',
          dates: '13/04/2026 to 18/04/2026',
          organizingBody: 'IIT Delhi & SSE Department of EEE',
          mode: 'Hybrid Mode',
          role: 'Convener & Participant',
          keyOutcomes: 'Hands-on MATLAB simulation of battery thermal management and CAN bus communication',
          link: 'https://iitd.ac.in/fdp/ev-powertrain-2026'
        },
        {
          title: 'AICTE ATAL FDP on Smart Grid Operation, Wide-Area Monitoring & Cyber-Security in SCADA Systems',
          type: 'AICTE ATAL Sponsored',
          dates: '06/04/2026 to 10/04/2026',
          organizingBody: 'NIT Surathkal',
          mode: 'Online Mode',
          role: 'Participant',
          keyOutcomes: 'Trained on synchrophasor PMU measurements and smart inverter IEEE 1547 standards',
          link: 'https://atalacademy.aicte-india.org/cert/eee-surathkal-312'
        }
      ],
      sdp: [
        {
          title: 'Hands-on SDP on MATLAB & Simulink for Power Electronics Circuit Simulation & Motor Drives',
          date: '15/04/2026 to 17/04/2026',
          type: 'Technical SDP Certification',
          resourcePerson: 'Er. S. Mohan (Senior Application Engineer, MathWorks Partner India)',
          mode: 'SSE Simulation Center',
          keyOutcomes: '55 students modeled PWM inverters, buck-boost converters, and vector control of PMSM motors',
          participantsCount: '55',
          coordinator: 'Mr. K. Gangadhar',
          link: 'https://sseptp.org/sdp/matlab-powerelec'
        },
        {
          title: 'Industrial Automation Workshop: PLC, SCADA & VFD Programming for Manufacturing Plants',
          date: '23/04/2026',
          type: 'Industrial Automation SDP',
          resourcePerson: 'Er. P. Venkatesh (Senior Automation Specialist, Schneider Electric)',
          mode: 'SSE Industrial Automation Lab',
          keyOutcomes: '48 students programmed Siemens S7-1200 PLCs and configured SCADA mimic diagrams',
          participantsCount: '48',
          coordinator: 'Er. D. Surendra',
          link: 'https://sseptp.org/sdp/plc-scada'
        }
      ],
      facultyAchievements: [
        {
          name: 'Mr. K. Gangadhar',
          award: 'Excellence in Renewable Energy Research Award',
          organization: 'Solar Energy Society of India (SESI) - AP Chapter',
          date: '18/04/2026',
          link: 'https://sesi-india.org/awards-2026'
        },
        {
          name: 'Er. D. Surendra',
          award: 'Best Presentation Award in Power Systems Session',
          organization: 'IEEE Power & Energy Society (PES) India Section',
          date: '10/04/2026',
          link: 'https://ieee-pes.org/awards/2026'
        }
      ],
      studentAchievements: [
        {
          nameRoll: 'N. Harish (22SSE1A0218) & G. Prasanth (22SSE1A0231)',
          award: '1st Prize & Rs. 25,000 Cash in National Solar Vehicle Prototyping Challenge',
          event: 'ENERGYCON 2026',
          organization: 'IIT Madras',
          durationDate: '12/04/2026 to 13/04/2026',
          link: 'https://iitm.ac.in/energycon/results'
        },
        {
          nameRoll: 'S. Kavya (23SSE1A0244)',
          award: '2nd Prize in State Level Circuit Simulation & Electrical Hackathon',
          event: 'VOLTKSHETRA 2026',
          organization: 'JNTU Pulivendula',
          durationDate: '20/04/2026',
          link: 'https://jntuacep.ac.in/voltksetra'
        }
      ],
      certifications: [
        {
          title: 'Power System Protection and Switchgear Testing',
          type: 'NPTEL-AICTE FDP Certification',
          duration: '12 Weeks',
          platform: 'SWAYAM / NPTEL (IIT Roorkee)',
          enrolled: '38',
          certified: '35 Certified (10 Elite Silver)',
          keyOutcomes: 'Mastered numerical distance relaying, differential protection, and breaker testing',
          link: 'https://nptel.ac.in/noc/Ecertificate/?q=NPTEL26EE12'
        },
        {
          title: 'Electric Vehicles and Mobility Transition',
          type: 'NPTEL Elite Certification',
          duration: '8 Weeks',
          platform: 'SWAYAM / NPTEL (IIT Madras)',
          enrolled: '42',
          certified: '39 Certified',
          keyOutcomes: 'Deepened competency in lithium-ion cell chemistry, battery sizing, and traction motors',
          link: 'https://nptel.ac.in/noc/Ecertificate/?q=NPTEL26EE24'
        },
        {
          title: 'Schneider Electric Certified Industrial Energy Manager',
          type: 'Global Corporate Credential',
          duration: '6 Weeks',
          platform: 'Schneider Electric Energy University',
          enrolled: '28',
          certified: '26 Certified',
          keyOutcomes: 'Certified in industrial power factor correction and ISO 50001 energy audits',
          link: 'https://schneider-electric.com/energy-university'
        }
      ],
      deptMeetings: [
        {
          date: '03.04.2026',
          decisions: 'Review of Electric Vehicles lab setup, finalization of external examiners for major project vivas, and NAAC Criterion 3 data compilation.',
          policyChanges: 'Mandatory simulation verification in MATLAB/Simulink before hardware fabrication of all minor projects.',
          link: 'https://sseptp.org/iqac/eee/minutes-03-04-2026'
        },
        {
          date: '17.04.2026',
          decisions: 'Mid-term academic performance analysis, syllabus completion monitoring, and finalization of schedule for VOLTKSHETRA 2026.',
          policyChanges: 'Remedial coaching classes scheduled every Saturday for students scoring below 50% in mid-examinations.',
          link: 'https://sseptp.org/iqac/eee/minutes-17-04-2026'
        }
      ],
      mous: [
        {
          name: 'Rayalaseema Thermal Power Station (RTPS) / APGENCO',
          purpose: 'Industrial In-Plant Training, Power Plant Station Visits, and Student Substation Apprenticeships',
          datePeriod: 'Valid 2024 to 2027 (3 Years)',
          facultySpoc: 'Mr. K. Gangadhar (HOD - EEE)',
          link: 'https://sseptp.org/mou/apgenco-rtps'
        },
        {
          name: 'Schneider Electric India Pvt. Ltd.',
          purpose: 'Establishment of Advanced Switchgear & Smart Energy Management Center of Excellence',
          datePeriod: 'Valid 2025 to 2028 (3 Years)',
          facultySpoc: 'Er. D. Surendra (Assistant Professor - EEE)',
          link: 'https://sseptp.org/mou/schneider-electric'
        }
      ],
      additionalInitiatives: [
        {
          initiative: 'Campus Solar Energy Audit & Micro-Generation Dashboard',
          date: '04/04/2026',
          description: 'Students installed IoT smart meters on 100kW campus rooftop solar plant to monitor daily kWh yields in real-time.',
          outcomes: 'Monitored 12,400 kWh generation in April; provided students hands-on data analytics experience.',
          coordinator: 'Er. N. Venkatesh',
          link: 'https://sseptp.org/eee/solar-dashboard'
        },
        {
          initiative: 'Hands-on Electrical Machine Rewinding and Motor Servicing Clinic',
          date: '14/04/2026',
          description: 'Practical weekend clinic teaching students induction motor stator rewinding, insulation testing, and varnish curing.',
          outcomes: '40 students rewound 4 three-phase induction motors for department labs.',
          coordinator: 'Er. D. Surendra',
          link: 'https://sseptp.org/eee/rewinding-clinic'
        }
      ],
      techAssociation: [
        {
          event: 'VOLTKSHETRA 2026 - Annual National Electrical Technical Fest & Robo-Wars',
          date: '22/04/2026',
          type: 'Technical Association Mega Event',
          resourcePersonCoordinator: 'Er. C. Subbarayudu (Chief General Manager, APTRANSCO)',
          participants: '160 Students across 8 Engineering Institutions',
          outcomes: 'Conducted live circuit assembly competition, solar boat challenge, and technical paper presentations.',
          link: 'https://sseptp.org/associations/voltkshetra-2026'
        },
        {
          event: 'Distinguished Guest Lecture on HVDC Transmission & Grid Integration of Offshore Wind Farms',
          date: '08/04/2026',
          type: 'Technical Guest Lecture',
          resourcePersonCoordinator: 'Dr. V. Ramanarayanan (Former Professor, IISc Bengaluru)',
          participants: '105 EEE III & IV Year Students',
          outcomes: 'Insightful exposure to voltage source converter (VSC) technology in high-voltage DC links.',
          link: 'https://sseptp.org/associations/guest-lecture-hvdc'
        }
      ],
      iicCell: [
        {
          activity: 'Idea Pitch on Low-Cost Automated Solar Insect Traps for Agricultural Farmlands',
          date: '16/04/2026',
          description: 'Under IIC 6.0, students demonstrated solar-charged UV LED insect traps for pesticide-free pest control.',
          partner: 'AP State Agricultural University & NABARD',
          beneficiaries: '60 Engineering Students & 15 Local Farmers',
          outcomes: 'Shortlisted for NABARD rural innovation prototype seed grant.',
          link: 'https://mic.gov.in/iic/sse-eee-solar-pitch'
        },
        {
          activity: 'Intellectual Property Workshop on Patent Drafting in Clean Energy & Smart Grids',
          date: '25/04/2026',
          description: 'Guidance on patent classification, prior art search, and claims drafting for power conversion topologies.',
          partner: 'National Institute of Intellectual Property Management (NIIPM)',
          beneficiaries: '45 Students & 10 Faculty Members',
          outcomes: '2 provisional patent applications prepared for departmental filing.',
          link: 'https://mic.gov.in/iic/clean-energy-patents'
        }
      ],
      syllabus: [
        {
          subject: 'Power System Operation and Control',
          yearSem: 'IV B.Tech II Sem',
          faculty: 'Mr. K. Gangadhar',
          completed: '100%',
          pending: 'Nil',
          remarks: 'Completed. Load frequency control and economic dispatch question banks solved.'
        },
        {
          subject: 'Power Electronics & Drive Systems',
          yearSem: 'III B.Tech II Sem',
          faculty: 'Er. D. Surendra',
          completed: '95%',
          pending: '5%',
          remarks: 'AC-to-AC voltage controllers concluding; extra problem-solving sessions scheduled.'
        },
        {
          subject: 'Electric Vehicles and Energy Storage Systems',
          yearSem: 'III B.Tech II Sem',
          faculty: 'Er. N. Venkatesh',
          completed: '100%',
          pending: 'Nil',
          remarks: 'Completed. Battery management and motor drive simulation case studies verified.'
        },
        {
          subject: 'Control Systems Engineering',
          yearSem: 'II B.Tech II Sem',
          faculty: 'Mr. K. Gangadhar',
          completed: '90%',
          pending: '10%',
          remarks: 'State-space analysis and Nyquist stability criterion unit in progress.'
        }
      ]
    };
  }

  // 4. HUMANITIES & SCIENCES
  if (dept.includes('humanities') || dept.includes('sciences')) {
    return {
      journals: [
        {
          title: 'Synthesis, Structural Characterization and Photocatalytic Degradation of Organic Dyes Using Biosynthesized ZnO Nanoparticles',
          authors: 'Dr. Samba Sivaiah B, Dr. P. Sreenivasulu',
          journalName: 'Journal of Molecular Structure (Elsevier)',
          issnIsbn: '0022-2860',
          volIssueYear: '1298',
          pageNos: '137-149',
          indexedIn: 'Elsevier / SCI / Scopus',
          link: 'https://doi.org/10.1016/j.molstruc.2026.137149'
        },
        {
          title: 'Exact Analytical Solutions for Unsteady MHD Free Convective Boundary Layer Flow Past an Oscillating Porous Plate',
          authors: 'Dr. Samba Sivaiah B, Er. C. Radhika',
          journalName: 'International Journal of Applied Mathematics and Mechanics',
          issnIsbn: '0973-5968',
          volIssueYear: '18/1',
          pageNos: '34-48',
          indexedIn: 'Scopus / UGC CARE',
          link: 'https://doi.org/10.35940/ijamm.A1029.041826'
        }
      ],
      conferences: [
        {
          title: 'Enhanced Optical and Dielectric Properties of Rare-Earth Doped Borate Glasses for Optoelectronic Applications',
          authors: 'Dr. Samba Sivaiah B, Dr. K. Venkatesh',
          conferenceName: 'National Conference on Recent Advances in Material Science and Nanotechnology (NCRAMSN 2026)',
          date: '17th April 2026',
          locationMode: 'Sri Venkateswara University, Tirupati',
          indexedIn: 'Conference Proceedings',
          link: 'https://svu.edu.in/ncramsn2026/physics-18'
        },
        {
          title: 'Fostering 21st Century Communicative Competencies in Engineering Undergraduates: An ESL Pedagogical Model',
          authors: 'Dr. M. Sreenivas Prasad, Dr. Samba Sivaiah B',
          conferenceName: 'International Conference on English Language Teaching and Pedagogical Innovations (ICELT 2026)',
          date: '25th April 2026',
          locationMode: 'Hyderabad, India (Hybrid)',
          indexedIn: 'ELT Journal Series',
          link: 'https://icelt2026.org/proceedings/hs-04'
        }
      ],
      patents: [
        {
          title: 'Eco-Friendly Bio-Adsorbent Formulation Derived from Agricultural Biomass for Industrial Chromium Effluent Remediation',
          inventors: 'Dr. Samba Sivaiah B, Dr. P. Sreenivasulu',
          applicants: 'Sanskrithi School of Engineering',
          patentNumber: '202641031980 A',
          status: 'Published',
          awardedDate: '10/04/2026',
          link: 'https://ipindiaservices.gov.in/publicsearch'
        },
        {
          title: 'Portable Microscopic Spectrophotometric Sensor Kit for Rapid Hardness Testing in Groundwater',
          inventors: 'Dr. Samba Sivaiah B, Dr. M. Sreenivasulu',
          applicants: 'Sanskrithi School of Engineering',
          patentNumber: '202541091204 B',
          status: 'Awarded / Granted',
          awardedDate: '05/04/2026',
          link: 'https://ipindiaservices.gov.in/patents'
        }
      ],
      entrepreneurship: [
        {
          title: 'First-Year Engineering Science Exhibition & Young Innovators STEM Pitch Fest',
          date: '11/04/2026',
          type: 'STEM Ideation & Prototyping Competition',
          participants: '140 First-Year Students (35 Teams) & 8 Faculty Mentors',
          organizedBy: 'Department of Humanities & Sciences & EDC Cell',
          mode: 'SSE Ground Floor Exhibition Foyer',
          keyOutcomes: '3 student concepts on low-cost water filtration and solar lighting awarded incubation tokens',
          participantsCount: '140',
          mentorCoordinator: 'Dr. Samba Sivaiah B',
          status: 'Completed',
          link: 'https://sseptp.org/hs/stem-exhibition'
        },
        {
          title: 'Student Ideathon on Sustainable Green Chemistry Solutions for Daily Household Cleaning',
          date: '22/04/2026',
          type: 'Product Prototyping Demo',
          participants: '40 First-Year B.Tech Students',
          organizedBy: 'Chemistry Innovation Club',
          mode: 'SSE Engineering Chemistry Lab',
          keyOutcomes: 'Formulated non-toxic bio-enzyme surface cleaners using fruit peels',
          participantsCount: '40',
          mentorCoordinator: 'Dr. P. Sreenivasulu',
          status: 'Incubated',
          link: 'https://sseptp.org/hs/green-chemistry-ideathon'
        }
      ],
      nss: [
        {
          event: 'National Science Day Outreach & Fun Science Demonstrations at Beedupalli ZP School',
          date: '14/04/2026',
          venue: 'Zilla Parishad High School, Beedupalli',
          type: 'Educational Outreach & Scientific Literacy',
          participantsCount: '55 Student Volunteers',
          typeOfParticipants: 'First Year B.Tech Volunteers',
          outcomes: 'Demonstrated 18 fun physics and chemistry experiments to 220 rural school children',
          coordinator: 'Dr. M. Sreenivas Prasad & Mr. R. Naresh',
          link: 'https://sseptp.org/nss/science-outreach-2026'
        },
        {
          event: 'Village Literacy Awareness and Adult Education Camp in Rural Hamlets',
          date: '21/04/2026',
          venue: 'Prasanthigram Village Community Hall',
          type: 'Community Outreach & Literacy Drive',
          participantsCount: '40 Volunteers',
          typeOfParticipants: 'H&S First-Year Students',
          outcomes: 'Assisted 65 village adults with digital literacy, mobile banking safety, and signature training',
          coordinator: 'Dr. Samba Sivaiah B',
          link: 'https://sseptp.org/nss/village-literacy-camp'
        }
      ],
      fdpAttended: [
        {
          title: 'AICTE ATAL FDP on Advanced Mathematical Modeling and Numerical Analysis Using Python & SciPy',
          type: 'FDP',
          dates: '06/04/2026 to 10/04/2026',
          organizingBody: 'NIT Warangal Department of Mathematics',
          mode: 'Online',
          facultyAttended: 'Dr. Samba Sivaiah B, Dr. M. Sreenivas Prasad',
          link: 'https://atalacademy.aicte-india.org/cert/hs-warangal-204'
        }
      ],
      fdpOrganized: [
        {
          title: 'One-Week National Level FDP on Pedagogical Innovations & NEP 2020 Paradigm in Engineering Education',
          type: 'FDP',
          dates: '13/04/2026 to 18/04/2026',
          deptOrganized: 'Humanities & Sciences',
          mode: 'Hybrid',
          resourcePersonDetails: 'Prof. K. Venkateswarlu, Dean of Academic Affairs, IIT Madras, Chennai, Tamil Nadu - 600036',
          facultyCoordinators: 'Dr. Samba Sivaiah B, Mr. R. Naresh',
          link: 'https://iitm.ac.in/tlc/nep-pedagogy-2026'
        }
      ],
      fdp: [
        {
          title: 'One-Week National Level FDP on Pedagogical Innovations & NEP 2020 Paradigm in Engineering Education',
          type: 'National Level FDP',
          dates: '13/04/2026 to 18/04/2026',
          organizingBody: 'IIT Madras Teaching Learning Centre & SSE H&S Dept',
          mode: 'Hybrid Mode',
          role: 'Convener & Participant',
          keyOutcomes: 'Faculty trained on outcome-based rubric assessments, flipped classroom design, and digital pedagogy',
          link: 'https://iitm.ac.in/tlc/nep-pedagogy-2026'
        },
        {
          title: 'AICTE ATAL FDP on Advanced Mathematical Modeling and Numerical Analysis Using Python & SciPy',
          type: 'AICTE ATAL Sponsored',
          dates: '06/04/2026 to 10/04/2026',
          organizingBody: 'NIT Warangal Department of Mathematics',
          mode: 'Online Mode',
          role: 'Participant',
          keyOutcomes: 'Mastered numerical solutions for non-linear partial differential equations and fluid simulations',
          link: 'https://atalacademy.aicte-india.org/cert/hs-warangal-204'
        }
      ],
      sdp: [
        {
          title: 'Professional Communication, Business English Mastery & Soft Skills Certification Workshop',
          date: '16/04/2026 to 18/04/2026',
          type: 'Communication Skills SDP',
          resourcePerson: 'Dr. M. Sreenivas Prasad (Associate Professor & British Council Certified Trainer)',
          mode: 'SSE Advanced English Communication Skills Lab',
          keyOutcomes: '120 first-year students certified in interview presentation, group discussion, and business email writing',
          participantsCount: '120',
          coordinator: 'Dr. M. Sreenivas Prasad',
          link: 'https://sseptp.org/sdp/business-english-2026'
        },
        {
          title: 'Scientific Computing & Data Visualization with Python for First-Year Engineers',
          date: '23/04/2026',
          type: 'Computational Skills Workshop',
          resourcePerson: 'Er. K. Srikanth (Senior Data Scientist, Mu Sigma)',
          mode: 'SSE Computer Center - 1',
          keyOutcomes: '95 students plotted mathematical curves, matrix transformations, and physics kinematics simulations',
          participantsCount: '95',
          coordinator: 'Dr. Samba Sivaiah B',
          link: 'https://sseptp.org/sdp/python-scientific'
        }
      ],
      facultyAchievements: [
        {
          name: 'Dr. Samba Sivaiah B',
          award: 'Outstanding Professor & Researcher of the Year in Applied Sciences Award',
          organization: 'Andhra Pradesh Academy of Sciences (APAS)',
          date: '18/04/2026',
          link: 'https://apas-india.org/awards-2026'
        },
        {
          name: 'Dr. M. Sreenivas Prasad',
          award: 'Distinguished ESL Educator of the Year Award',
          organization: 'English Language Teachers Association of India (ELTAI)',
          date: '10/04/2026',
          link: 'https://eltai.in/awards/2026'
        }
      ],
      studentAchievements: [
        {
          nameRoll: 'R. Kavyasree (25SSE1A0512) & Team',
          award: '1st Prize & Gold Trophy in State-Level Inter-Collegiate Science Quiz Championship',
          event: 'PRAGYAN 2026',
          organization: 'NIT Tiruchirappalli',
          durationDate: '12/04/2026',
          link: 'https://nitt.edu/pragyan/results'
        },
        {
          nameRoll: 'T. Vamsi Krishna (25SSE1A0408)',
          award: '2nd Prize in Inter-University Mathematical Riddle & Olympiad',
          event: 'MATHLETICS 2026',
          organization: 'Sri Venkateswara University, Tirupati',
          durationDate: '19/04/2026',
          link: 'https://svu.edu.in/events/mathletics'
        }
      ],
      certifications: [
        {
          title: 'Linear Algebra and Differential Equations for Engineers',
          type: 'NPTEL-AICTE FDP Certification',
          duration: '12 Weeks',
          platform: 'SWAYAM / NPTEL (IIT Kanpur)',
          enrolled: '65',
          certified: '58 Certified (16 with Elite Silver)',
          keyOutcomes: 'Deepened mathematical competency in eigenvalues, orthogonal projections, and boundary value problems',
          link: 'https://nptel.ac.in/noc/Ecertificate/?q=NPTEL26MA12'
        },
        {
          title: 'Cambridge English Assessment - B2 Business Vantage Certification',
          type: 'International English Certification',
          duration: '8 Weeks',
          platform: 'Cambridge Assessment English',
          enrolled: '50',
          certified: '46 Certified',
          keyOutcomes: 'Validated international workplace English proficiency across speaking, listening, and reading',
          link: 'https://cambridgeenglish.org/verify/cert-b2'
        },
        {
          title: 'Applied Engineering Physics & Quantum Semiconductor Materials',
          type: 'NPTEL Elite Certification',
          duration: '8 Weeks',
          platform: 'SWAYAM / NPTEL (IIT Delhi)',
          enrolled: '40',
          certified: '36 Certified',
          keyOutcomes: 'Mastered wave mechanics, laser systems, and optical fiber attenuation characteristics',
          link: 'https://nptel.ac.in/noc/Ecertificate/?q=NPTEL26PH08'
        }
      ],
      deptMeetings: [
        {
          date: '02.04.2026',
          decisions: 'Review of First-Year B.Tech Mid-Term examination results, course file verification, bridge course outcomes, and mentor-mentee counseling.',
          policyChanges: 'Mandatory bilingual peer-tutoring sessions scheduled for students from rural vernacular backgrounds.',
          link: 'https://sseptp.org/iqac/hs/minutes-02-04-2026'
        },
        {
          date: '17.04.2026',
          decisions: 'Syllabus coverage review across all 5 engineering branches, laboratory equipment audit, and scheduling of SCIENCE FEST 2026.',
          policyChanges: 'Minimum 90% syllabus completion required before commencement of model practical exams.',
          link: 'https://sseptp.org/iqac/hs/minutes-17-04-2026'
        }
      ],
      mous: [
        {
          name: 'Cambridge University Press & Assessment India',
          purpose: 'Official Cambridge English Assessment Preparation Center, Teacher Training, and Global English Certification',
          datePeriod: 'Valid 2024 to 2027 (3 Years)',
          facultySpoc: 'Dr. M. Sreenivas Prasad (Associate Professor - English)',
          link: 'https://sseptp.org/mou/cambridge-assessment'
        },
        {
          name: 'British Council English Language Training Partner',
          purpose: 'Digital English Library Access, IELTS Readiness Sessions, and Faculty Development Programs',
          datePeriod: 'Valid 2025 to 2028 (3 Years)',
          facultySpoc: 'Dr. Samba Sivaiah B (HOD - H&S)',
          link: 'https://sseptp.org/mou/british-council'
        }
      ],
      additionalInitiatives: [
        {
          initiative: 'Language Clinic & Daily Public Speaking Toastmasters Forum',
          date: '04/04/2026',
          description: 'Department established a zero-judgment public speaking circle every evening to help students overcome stage fright.',
          outcomes: 'Over 160 first-year students delivered impromptu extempore speeches.',
          coordinator: 'Dr. M. Sreenivas Prasad',
          link: 'https://sseptp.org/hs/language-clinic'
        },
        {
          initiative: 'Mathematics Peer-Assisted Learning (PAL) Cell for Engineering Undergraduates',
          date: '15/04/2026',
          description: 'Top-performing student mentors conduct Saturday problem-solving tutorials for engineering mathematics.',
          outcomes: 'Remedial pass percentage improved from 68% to 88% in mid-examinations.',
          coordinator: 'Dr. Samba Sivaiah B',
          link: 'https://sseptp.org/hs/pal-math-cell'
        }
      ],
      techAssociation: [
        {
          event: 'SCIENCE FEST 2026 - Annual Inter-Collegiate Science & Humanities Symposium',
          date: '22/04/2026',
          type: 'Annual Department Science Symposium',
          resourcePersonCoordinator: 'Prof. K. R. S. Murthy (Emeritus Professor of Physics, IISc Bengaluru)',
          participants: '200 First-Year Students across 10 Engineering Institutions',
          outcomes: 'Conducted science poster presentation, mathematical treasure hunt, and debate competition.',
          link: 'https://sseptp.org/associations/sciencefest-2026'
        },
        {
          event: 'Guest Lecture on The Magic of Mathematics in Modern Artificial Intelligence & Quantum Computing',
          date: '08/04/2026',
          type: 'Distinguished Guest Lecture',
          resourcePersonCoordinator: 'Dr. P. V. Ramana (Senior Scientist, TIFR Mumbai)',
          participants: '150 First-Year B.Tech Students',
          outcomes: 'Fascinating demonstration of linear algebra, probability, and matrix decomposition in search engines.',
          link: 'https://sseptp.org/associations/guest-lecture-math-ai'
        }
      ],
      iicCell: [
        {
          activity: 'Idea Pitch on Biodegradable Plant-Based Seed Packaging for Agro-Farming',
          date: '16/04/2026',
          description: 'Under IIC 6.0, students demonstrated water-soluble starch and paper-pulp seedling containers.',
          partner: 'AP State Seed Development Corporation & NABARD',
          beneficiaries: '85 Engineering Students & 10 Local Farmers',
          outcomes: 'Awarded 1st place in campus environmental category with seed fund support.',
          link: 'https://mic.gov.in/iic/sse-hs-seed-pitch'
        },
        {
          activity: 'Workshop on Scientific Patent Search Databases and Prior Art Analysis',
          date: '25/04/2026',
          description: 'Hands-on training on Google Patents, Espacenet, and Indian Patent Office searches for chemical inventions.',
          partner: 'National Institute of Intellectual Property Management (NIIPM)',
          beneficiaries: '60 Students & 16 Faculty Members',
          outcomes: '3 chemical process disclosures cleared for patent preparation.',
          link: 'https://mic.gov.in/iic/hs-patent-workshop'
        }
      ],
      syllabus: [
        {
          subject: 'Linear Algebra and Calculus (Mathematics - I)',
          yearSem: 'I B.Tech II Sem',
          faculty: 'Dr. Samba Sivaiah B',
          completed: '100%',
          pending: 'Nil',
          remarks: 'Syllabus fully completed. 3 revision sessions and previous question papers solved.'
        },
        {
          subject: 'Applied Physics & Semiconductor Devices',
          yearSem: 'I B.Tech II Sem',
          faculty: 'Dr. P. Sreenivasulu',
          completed: '95%',
          pending: '5%',
          remarks: 'Superconductivity unit in progress; lab exam schedule notified.'
        },
        {
          subject: 'Engineering Chemistry & Polymer Technology',
          yearSem: 'I B.Tech II Sem',
          faculty: 'Dr. Samba Sivaiah B',
          completed: '92%',
          pending: '8%',
          remarks: 'Corrosion control and battery technology modules concluding this week.'
        },
        {
          subject: 'Communicative English & Professional Language Skills',
          yearSem: 'I B.Tech II Sem',
          faculty: 'Dr. M. Sreenivas Prasad',
          completed: '100%',
          pending: 'Nil',
          remarks: 'Completed. Mock interviews, group discussions, and phonetics tests finalized.'
        }
      ]
    };
  }

  // 5. MECHANICAL ENGINEERING
  if (dept.includes('mechanical') || dept.includes('mech')) {
    return {
      journals: [
        {
          title: 'Thermo-Hydraulic Performance and Entropy Generation Analysis of Microchannel Heat Sinks for EV Battery Thermal Management',
          authors: 'C Anil Kumar Reddy, Dr. G. Balakrishna',
          journalName: 'International Journal of Thermal Sciences',
          issnIsbn: '1290-0729',
          volIssueYear: '198/4',
          pageNos: '108-124',
          indexedIn: 'SCI / Scopus / Elsevier',
          link: 'https://doi.org/10.1016/j.ijthermalsci.2026.108422'
        },
        {
          title: 'Mechanical Characterization and Wear Behavior of Al7075 Hybrid Metal Matrix Composites Reinforced with SiC and Graphene Nanoplatelets',
          authors: 'Er. P. Venkatesh, C Anil Kumar Reddy',
          journalName: 'Materials Today: Proceedings',
          issnIsbn: '2214-7853',
          volIssueYear: '92/2',
          pageNos: '315-329',
          indexedIn: 'Scopus / Elsevier',
          link: 'https://doi.org/10.1016/j.matpr.2026.04.112'
        }
      ],
      conferences: [
        {
          title: 'Experimental Investigation of Friction Stir Lap Welding of Dissimilar AA6061 and Galvanized Steel Joints',
          authors: 'C Anil Kumar Reddy, Er. T. Suresh Babu',
          conferenceName: 'International Conference on Advanced Materials and Manufacturing Processes (ICAMMP 2026)',
          date: '21st April 2026',
          locationMode: 'IIT Madras, Chennai (In-Person)',
          indexedIn: 'Springer Nature / Scopus',
          link: 'https://springer.com/conf/icammp2026/mech-045'
        },
        {
          title: 'Topology Optimization and Fatigue Life Assessment of Automotive Control Arms Fabricated via Laser Powder Bed Fusion',
          authors: 'Er. N. Sivasankar, C Anil Kumar Reddy',
          conferenceName: 'IEEE International Conference on Robotics and Mechanical Automation (IEEE ICRMA 2026)',
          date: '14th April 2026',
          locationMode: 'Bengaluru, India (Hybrid)',
          indexedIn: 'IEEE Xplore',
          link: 'https://ieee-xplore.org/document/icrma2026-mech31'
        }
      ],
      patents: [
        {
          title: 'Multi-Axis Automated Tool-Changer Mechanism for Portable CNC Milling Machines with Smart Vibration Dampers',
          inventors: 'C Anil Kumar Reddy, Er. P. Venkatesh',
          applicants: 'Sanskrithi School of Engineering',
          patentNumber: '202641031982 A',
          status: 'Published',
          awardedDate: '10/04/2026',
          link: 'https://ipindiaservices.gov.in/publicsearch'
        }
      ],
      entrepreneurship: [
        {
          title: 'Design and Prototype Fabrication of Low-Cost Agricultural Seed-Drill and Fertilizing Attachment for Two-Wheelers',
          date: '18/04/2026',
          type: 'Hardware Incubator Demo Day',
          participants: '38 Mechanical Final Year Students',
          organizedBy: 'SSE Hardware Innovation Lab & AP Innovation Society',
          mode: 'Offline',
          keyOutcomes: 'Field demonstration completed with local farmers; applied for prototype seed grant of Rs. 1.5 Lakhs.',
          participantsCount: '38',
          mentorCoordinator: 'C Anil Kumar Reddy',
          status: 'Prototype Stage',
          link: 'https://sseptp.org/incubator/mech-seed-drill'
        }
      ],
      nss: [
        {
          event: 'Industrial Safety Awareness and Workplace Ergonomics Drive for Local Small-Scale Fabrication Units',
          date: '17/04/2026',
          venue: 'Industrial Estate, Beedupalli & SSE Campus',
          type: 'Community Extension & Safety Drive',
          participantsCount: '70',
          typeOfParticipants: 'Mechanical Students & 25 Local Welders/Machinists',
          outcomes: 'Distributed eye protection goggles, safety gloves, and delivered hands-on training on fire extinguisher usage.',
          coordinator: 'Er. T. Suresh Babu',
          link: 'https://sseptp.org/nss/industrial-safety-2026'
        }
      ],
      fdpAttended: [
        {
          title: 'AICTE-ATAL One-Week FDP on Digital Twins, Industry 4.0, and Smart Connected Manufacturing Systems',
          type: 'FDP',
          dates: '13/04/2026 to 18/04/2026',
          organizingBody: 'National Institute of Technology (NIT) Warangal',
          mode: 'Hybrid',
          facultyAttended: 'C Anil Kumar Reddy',
          link: 'https://atalacademy.aicte-india.org/certificates/nitw-mech-411'
        },
        {
          title: 'Advanced Computational Fluid Dynamics (CFD) with ANSYS Fluent for Renewable Energy Systems',
          type: 'Workshop',
          dates: '06/04/2026 to 10/04/2026',
          organizingBody: 'IIT Hyderabad & ANSYS Academic Program',
          mode: 'Online',
          facultyAttended: 'Er. P. Venkatesh',
          link: 'https://iith.ac.in/workshops/cfd-2026-cert'
        }
      ],
      fdpOrganized: [
        {
          title: 'Five-Day National Workshop on 3D Printing & Additive Manufacturing Technologies for Rapid Prototyping',
          type: 'Workshop',
          dates: '20/04/2026 to 24/04/2026',
          deptOrganized: 'Mechanical Engineering',
          mode: 'Offline',
          resourcePersonDetails: 'Dr. K. Srinivas (Head of Additive R&D, BEML Bengaluru) and Er. M. Anand (Chief Design Engineer, Stratasys India)',
          facultyCoordinators: 'C Anil Kumar Reddy, Er. N. Sivasankar',
          link: 'https://sseptp.org/fdp/mech-3dprinting-2026'
        }
      ],
      sdp: [
        {
          title: 'Comprehensive Hands-On Student Training in SolidWorks 2026 & Generative Engineering Design',
          date: '08/04/2026 to 12/04/2026',
          type: 'Software Skill Development Course',
          resourcePerson: 'Er. D. Raviteja (Certified Dassault Systemes SolidWorks Professional, CAD Vision Hyd)',
          mode: 'Offline (CAD/CAM Lab)',
          keyOutcomes: '65 Mechanical students certified in CSWA level 3D part modeling, sheet metal design, and geometric tolerancing.',
          participantsCount: '65',
          coordinator: 'Er. P. Venkatesh',
          link: 'https://sseptp.org/sdp/solidworks-certified-batch'
        }
      ],
      facultyAchievements: [
        {
          name: 'C Anil Kumar Reddy',
          award: 'Outstanding HOD & Academic Leadership Award in Engineering Excellence 2026',
          organization: 'Institution of Engineers (India) - Andhra Pradesh State Center',
          date: '15/04/2026',
          link: 'https://ieindia.org/awards/leadership-2026-reddy'
        }
      ],
      studentAchievements: [
        {
          nameRoll: 'K. Mohan Krishna (23ME104) & Team Sanskrithi Racers',
          award: 'First Prize & Best Acceleration Trophy in All-India Electric Go-Kart Championship',
          event: 'National Student Karting Competition (NSKC 2026)',
          organization: 'Motorsports Club of India, Coimbatore',
          durationDate: '18/04/2026 to 20/04/2026',
          link: 'https://nskc-india.org/winners-2026'
        }
      ],
      certifications: [
        {
          title: 'Fundamental of Manufacturing Processes (NPTEL)',
          type: 'NPTEL SWAYAM Online Certification',
          duration: '12 Weeks',
          platform: 'NPTEL / IIT Roorkee',
          enrolled: '45',
          certified: '40',
          keyOutcomes: '40 students cleared national exam with 8 Elite Gold badges.',
          link: 'https://nptel.ac.in/noc/Ecertificate/?q=NPTEL26ME18S4'
        },
        {
          title: 'Autodesk Certified Professional: Inventor for Mechanical Design',
          type: 'Autodesk Global Certification',
          duration: '6 Weeks',
          platform: 'Autodesk / Coursera',
          enrolled: '35',
          certified: '32',
          keyOutcomes: '32 candidates successfully certified as Autodesk Design Associates.',
          link: 'https://coursera.org/verify/professional-cert/mech-inventor-sse'
        }
      ],
      deptMeetings: [
        {
          date: '06/04/2026',
          decisions: 'Conducted Department Advisory Committee (DAC) meeting. Approved revisions in Machine Drawing and Automobile Lab manuals. Scheduled remedial classes for engineering mechanics.',
          policyChanges: 'Mandatory internship placement protocol finalized for all 3rd year mechanical students.',
          link: 'https://sseptp.org/governance/mech-dac-minutes-april26'
        }
      ],
      mous: [
        {
          name: 'Bharat Earth Movers Limited (BEML) Training & R&D Hub, Palakkad',
          purpose: 'Long-term partnership for joint student internships, heavy machinery dynamic analysis, and faculty sabbatical training.',
          datePeriod: '11/04/2026 (Valid 3 Years)',
          facultySpoc: 'C Anil Kumar Reddy',
          link: 'https://sseptp.org/mous/beml-mechanical-mou'
        }
      ],
      additionalInitiatives: [
        {
          initiative: 'Establishment of Advanced CNC Machining & Rapid Tooling Innovation Cell',
          date: '10/04/2026',
          description: 'Refurbished CNC lathe and 4-axis VMC center opened for commercial job works and student robotic arm fabrication.',
          outcomes: 'Generated initial job-order revenue of Rs. 32,000 and supported 4 inter-disciplinary capstone projects.',
          coordinator: 'Er. T. Suresh Babu',
          link: 'https://sseptp.org/mech/cnc-center'
        }
      ],
      techAssociation: [
        {
          event: 'MECHELON 2026 - National Mechanical Engineering Festival & CAD Combat',
          date: '23/04/2026',
          type: 'National Technical Symposium',
          resourcePersonCoordinator: 'Er. P. Ramalingam (General Manager, Kia Motors India Pvt. Ltd.)',
          participants: '160 Students across 8 Engineering Colleges',
          outcomes: 'Conducted CAD 3D modeling race, contraption design challenge, and technical paper sessions on zero-emission transport.',
          link: 'https://sseptp.org/associations/mechelon-2026'
        }
      ],
      iicCell: [
        {
          activity: 'Design Pitch on Solar Thermal Desalination and Drinking Water Condenser for Rural Anantapur',
          date: '15/04/2026',
          description: 'Under IIC 6.0, mechanical students showcased a parabolic-trough solar evaporator yielding 15 liters of potable water daily.',
          partner: 'National Institute of Solar Energy (NISE) & MSME Development Institute',
          beneficiaries: '80 Engineering Students & 15 Village Heads',
          outcomes: 'Shortlisted for Rs. 2 Lakhs state innovation grant.',
          link: 'https://mic.gov.in/iic/sse-mech-solar-pitch'
        }
      ],
      syllabus: [
        {
          subject: 'Kinematics & Dynamics of Machinery',
          yearSem: 'II B.Tech II Sem',
          faculty: 'C Anil Kumar Reddy',
          completed: '100%',
          pending: 'Nil',
          remarks: 'Syllabus 100% completed. Conducted 3 revision hours for gyroscopic couples and balancing.'
        },
        {
          subject: 'Heat Transfer & Thermal Power Systems',
          yearSem: 'III B.Tech II Sem',
          faculty: 'Er. P. Venkatesh',
          completed: '94%',
          pending: '6%',
          remarks: 'Radiation network analysis underway; two extra hours scheduled this week.'
        },
        {
          subject: 'Design of Machine Elements - II',
          yearSem: 'III B.Tech II Sem',
          faculty: 'Er. T. Suresh Babu',
          completed: '96%',
          pending: '4%',
          remarks: 'Bearings and gear design modules completed; model question papers solved.'
        },
        {
          subject: 'Automobile Engineering & Hybrid Drives',
          yearSem: 'IV B.Tech II Sem',
          faculty: 'Er. N. Sivasankar',
          completed: '100%',
          pending: 'Nil',
          remarks: 'Full curriculum covered including modern EV powertrains and regenerative braking.'
        }
      ]
    };
  }

  // 6. DEFAULT: CIVIL ENGINEERING
  return {
    journals: [
      {
        title: 'Comparative Study on Conventional and Geopolymer Precast Concrete Systems for Sustainable Infrastructure',
        authors: 'Kummara Siva Prasad',
        journalName: 'GIS SCIENCE JOURNAL',
        issnIsbn: '1869-9391',
        volIssueYear: '13/4',
        pageNos: '1-23',
        indexedIn: 'Scopus',
        link: 'https://doi.org/20.18001.GSJ.2026.V13I4.26.72969390'
      },
      {
        title: 'Experimental Investigation on Durability and Strength Characteristics of Self-Compacting Concrete with GGBS and Silica Fume',
        authors: 'Dr. M. Sreenivasulu, K Siva Prasad',
        journalName: 'International Journal of Structural Concrete & Materials',
        issnIsbn: '2277-3878',
        volIssueYear: '12/2',
        pageNos: '45-58',
        indexedIn: 'UGC CARE / Scopus',
        link: 'https://doi.org/10.35940/ijscm.B1204.041226'
      }
    ],
    conferences: [
      {
        title: 'Development of Eco-Friendly Precast Concrete Using Recycled Aggregates and Low-Carbon Cement Admixtures',
        authors: 'K Siva Prasad',
        conferenceName: 'ICIMES 2026',
        date: '25th Aug 2026',
        locationMode: 'Vizag, Hybrid Mode',
        indexedIn: 'Scopus / Under Review',
        link: 'https://icimes2026.org/proceedings/civil-04'
      },
      {
        title: 'Non-Linear Seismic Vulnerability Assessment of Multi-Storey Reinforced Concrete Structures in Zone III',
        authors: 'Er. B. Ramesh, K Siva Prasad',
        conferenceName: 'International Conference on Sustainable Earthquake Engineering (ICSEE 2026)',
        date: '14th April 2026',
        locationMode: 'Bengaluru, In-Person',
        indexedIn: 'Springer Proceedings',
        link: 'https://icsee2026.org/papers/seismic-civil-89'
      }
    ],
    patents: [
      {
        title: 'Smart Sensor-Integrated Geopolymer Precast Concrete Block for Real-Time Structural Health Monitoring',
        inventors: 'K Siva Prasad, Dr. V. Annapurna',
        applicants: 'Sanskrithi School of Engineering',
        patentNumber: '202641018923 A',
        status: 'Published',
        awardedDate: '12/04/2026',
        link: 'https://ipindiaservices.gov.in/publicsearch'
      },
      {
        title: 'Automated Solar-Powered Accelerated Steam Curing Chamber for Rapid Highway Pavement Blocks',
        inventors: 'K Siva Prasad, Er. B. Ramesh',
        applicants: 'Sanskrithi School of Engineering',
        patentNumber: '202541098231 B',
        status: 'Awarded / Granted',
        awardedDate: '04/04/2026',
        link: 'https://ipindiaservices.gov.in/patents'
      }
    ],
    entrepreneurship: [
      {
        title: 'Bootcamp on Sustainable Building Start-ups & Green Infrastructure Solutions',
        date: '08/04/2026',
        type: 'Student Hackathon & Ideation',
        participants: '64 Students & 4 Mentors',
        organizedBy: 'EDC Cell & Civil Engineering Department',
        mode: 'Offline - SSE Seminar Hall',
        keyOutcomes: '3 prototype business plans submitted for seed funding incubation',
        participantsCount: '64',
        mentorCoordinator: 'K Siva Prasad',
        status: 'Completed',
        link: 'https://sseptp.org/edc/green-concrete-2026'
      },
      {
        title: 'Idea-to-Product Pitch on Upcycled Plastic-Aggregate Paver Tiles for Rural Roads',
        date: '17/04/2026',
        type: 'Incubation Pitch & Demonstration',
        participants: '38 Students & 3 Local Contractors',
        organizedBy: 'Civil Engineering EDC Chapter',
        mode: 'SSE Concrete Technology Lab',
        keyOutcomes: '1 student start-up registered under MSME Udyam portal',
        participantsCount: '38',
        mentorCoordinator: 'Dr. M. Sreenivasulu',
        status: 'Incubated',
        link: 'https://sseptp.org/edc/plastic-pavers-2026'
      }
    ],
    nss: [
      {
        event: 'Campus Tree Plantation & Water Conservation Awareness Drive',
        date: '14/04/2026',
        venue: 'Beedupalli Village & SSE Green Belt',
        type: 'Extension & Community Outreach',
        participantsCount: '85 Volunteers',
        typeOfParticipants: 'Civil Engineering Students',
        outcomes: 'Planted 150 indigenous saplings and conducted rainwater harvesting workshop for local community',
        coordinator: 'Mr. R. Naresh (NSS Program Officer)',
        link: 'https://sseptp.org/nss/plantation-april-2026'
      },
      {
        event: 'Potable Drinking Water Quality & Ground Water Table Testing Camp',
        date: '20/04/2026',
        venue: 'Prasanthigram Gram Panchayat',
        type: 'Community Health & Water Testing',
        participantsCount: '45 Student Volunteers',
        typeOfParticipants: 'B.Tech Civil III Year',
        outcomes: 'Tested 24 community borewell samples for pH, TDS, fluorides and submitted water report to local authorities',
        coordinator: 'Er. S. Kavitha (Environmental Lab In-charge)',
        link: 'https://sseptp.org/nss/water-testing-camp'
      }
    ],
    fdpAttended: [
      {
        title: '5-Day Online AICTE-ATAL Academy FDP on Geotechnical Disaster Risk Reduction & Landslide Mitigation',
        type: 'FDP',
        dates: '06/04/2026 to 10/04/2026',
        organizingBody: 'NIT Tiruchirappalli',
        mode: 'Online',
        facultyAttended: 'K Siva Prasad, Er. S. Kavitha',
        link: 'https://atalacademy.aicte-india.org/cert/civil-928'
      }
    ],
    fdpOrganized: [
      {
        title: 'One-Week National FDP on Advanced BIM Applications & Digital Twins in Civil Infrastructure',
        type: 'FDP',
        dates: '15/04/2026 to 20/04/2026',
        deptOrganized: 'Civil Engineering',
        mode: 'Hybrid',
        resourcePersonDetails: 'Dr. C. Anjaneyulu, Senior Director of Infrastructure Engineering, L&T Construction, Chennai, Tamil Nadu - 600089',
        facultyCoordinators: 'K Siva Prasad, Dr. M. Sreenivasulu',
        link: 'https://iitm.ac.in/fdp/civil-bim-2026'
      }
    ],
    fdp: [
      {
        title: 'One-Week National FDP on Advanced BIM Applications & Digital Twins in Civil Infrastructure',
        type: 'National Level FDP',
        dates: '15/04/2026 to 20/04/2026',
        organizingBody: 'IIT Madras & SSE Centre of Excellence',
        mode: 'Hybrid Mode',
        role: 'Participant & Co-Host',
        keyOutcomes: 'Faculty gained proficiency in Revit BIM modeling, structural simulations, and digital twin workflows',
        link: 'https://iitm.ac.in/fdp/civil-bim-2026'
      },
      {
        title: '5-Day Online AICTE-ATAL Academy FDP on Geotechnical Disaster Risk Reduction & Landslide Mitigation',
        type: 'AICTE ATAL Sponsored',
        dates: '06/04/2026 to 10/04/2026',
        organizingBody: 'NIT Tiruchirappalli',
        mode: 'Online Mode',
        role: 'Participant',
        keyOutcomes: 'Trained on numerical slope stability analysis using PLAXIS-2D and GeoStudio software',
        link: 'https://atalacademy.aicte-india.org/cert/civil-928'
      }
    ],
    sdp: [
      {
        title: 'Skill Certification Workshop on Total Station Surveying & Drone LiDAR Mapping',
        date: '18/04/2026',
        type: 'Hands-on Technical SDP',
        resourcePerson: 'Er. M. Venkatesh (Senior GIS Specialist, Trimble India)',
        mode: 'Offline Field Workshop',
        keyOutcomes: '55 students certified in modern geomatics surveying and point-cloud data processing',
        participantsCount: '55',
        coordinator: 'K Siva Prasad',
        link: 'https://sseptp.org/sdp/survey-drone-2026'
      },
      {
        title: 'Industry Crash Course on ETABS & STAAD.Pro for High-Rise Earthquake Detailing',
        date: '21/04/2026 to 23/04/2026',
        type: 'Software Training SDP',
        resourcePerson: 'Er. G. Suresh (Senior Structural Engineer, Shapoorji Pallonji)',
        mode: 'SSE CAD Center',
        keyOutcomes: '60 students designed and detailed G+10 commercial building frame under IS 1893:2016',
        participantsCount: '60',
        coordinator: 'Er. B. Ramesh',
        link: 'https://sseptp.org/sdp/etabs-training'
      }
    ],
    facultyAchievements: [
      {
        name: 'K Siva Prasad',
        award: 'Outstanding Researcher in Sustainable Materials Award',
        organization: 'Indian Concrete Institute (ICI) - AP Chapter',
        date: '21/04/2026',
        link: 'https://ici-india.net/awards-2026'
      },
      {
        name: 'Dr. M. Sreenivasulu',
        award: 'Best Technical Paper Presentation Award (Gold Medal)',
        organization: 'Indian Geotechnical Society (IGS)',
        date: '11/04/2026',
        link: 'https://igs.org.in/awards/2026'
      }
    ],
    studentAchievements: [
      {
        nameRoll: 'M. Harish (23SSE1A0114) & P. Sneha (23SSE1A0128)',
        award: '1st Prize in National Model Making & Structural Bridge Design',
        event: 'TECHKRITHI 2026',
        organization: 'NIT Warangal',
        durationDate: '10/04/2026 to 12/04/2026',
        link: 'https://nitw.ac.in/techkrithi/results'
      },
      {
        nameRoll: 'K. Tharun Kumar (22SSE1A0105)',
        award: '2nd Prize in State Level AutoCAD 3D Civil Modeling Challenge',
        event: 'SURVEYCON 2026',
        organization: 'JNTU Anantapur',
        durationDate: '15/04/2026',
        link: 'https://jntua.ac.in/events/surveycon'
      }
    ],
    certifications: [
      {
        title: 'Design of Reinforced Concrete Structures',
        type: 'NPTEL-AICTE FDP Certification',
        duration: '12 Weeks',
        platform: 'SWAYAM / NPTEL (IIT Kharagpur)',
        enrolled: '42',
        certified: '38 (12 with Elite Silver)',
        keyOutcomes: 'Enhanced analytical proficiency in limit state design and seismic load detailing',
        link: 'https://nptel.ac.in/noc/Ecertificate/?q=NPTEL26CE10'
      },
      {
        title: 'Autodesk Certified Professional in Civil 3D Infrastructure Modeling',
        type: 'Global Industry Professional Credential',
        duration: '6 Weeks',
        platform: 'Autodesk Education Portal',
        enrolled: '25',
        certified: '24 Certified',
        keyOutcomes: 'Mastered corridor modeling, grading optimization, and stormwater pipe network design',
        link: 'https://autodesk.com/verify/cert-civil-2026'
      },
      {
        title: 'Advanced Foundation Engineering & Geotechnical Design',
        type: 'NPTEL Elite Certification',
        duration: '8 Weeks',
        platform: 'SWAYAM / NPTEL (IIT Madras)',
        enrolled: '30',
        certified: '27 Certified',
        keyOutcomes: 'Deepened competency in pile load calculations and machine foundation vibration design',
        link: 'https://nptel.ac.in/noc/Ecertificate/?q=NPTEL26CE18'
      }
    ],
    deptMeetings: [
      {
        date: '03.04.2026',
        decisions: 'Review of CSP Project milestones, course file completion verification, NAAC Criterion 3 & 4 data compilation, and final semester external viva schedule.',
        policyChanges: 'Mandatory rubric-based assessment for 8th semester capstone internships implemented.',
        link: 'https://sseptp.org/iqac/civil/minutes-03-04-2026'
      },
      {
        date: '19.04.2026',
        decisions: 'Mid-term academic audit analysis, syllabus coverage tracking review, allocation of remedial classes for slow learners, and finalization of CIVILERA 2026 schedule.',
        policyChanges: 'Minimum 85% syllabus coverage mandatory before commencement of pre-final lab exams.',
        link: 'https://sseptp.org/iqac/civil/minutes-19-04-2026'
      }
    ],
    mous: [
      {
        name: 'UltraTech Cement Ltd. & SSE Department of Civil Engineering',
        purpose: 'Industry Internship, Industrial Visits, Concrete Mix Testing Lab Sponsorship, and Graduate Trainee Campus Placement',
        datePeriod: 'Valid 2025 to 2028 (3 Years)',
        facultySpoc: 'K Siva Prasad (HOD - Civil)',
        link: 'https://sseptp.org/mou/ultratech-civil'
      },
      {
        name: 'National Highways Authority of India (NHAI) PIU Ananthapuramu',
        purpose: 'Institutional Collaboration for Highway Quality Audits, Traffic Volume Surveys, and Summer Student Apprenticeship',
        datePeriod: 'Valid 2024 to 2027 (3 Years)',
        facultySpoc: 'Er. B. Ramesh (Assistant Professor - Civil)',
        link: 'https://sseptp.org/mou/nhai-civil'
      }
    ],
    additionalInitiatives: [
      {
        initiative: 'Establishment of Department Consultancy & Material Testing Cell',
        date: '05/04/2026',
        description: 'Commercial compressive strength and soil bearing capacity testing launched for local government contractors.',
        outcomes: 'Generated Rs. 45,000 in testing revenue; provided students live industrial testing exposure.',
        coordinator: 'Er. B. Ramesh',
        link: 'https://sseptp.org/civil/consultancy-cell'
      },
      {
        initiative: 'Civil Engineering Student Innovation & Model Exhibition Zone',
        date: '12/04/2026',
        description: 'Permanent display gallery set up in Civil Block featuring 1:50 scale models of cable-stayed bridges and green building concepts.',
        outcomes: 'Showcases student engineering craftsmanship to campus visitors and school groups.',
        coordinator: 'Er. S. Kavitha',
        link: 'https://sseptp.org/civil/model-gallery'
      }
    ],
    techAssociation: [
      {
        event: 'CIVILERA 2026 - Annual Technical Symposium & Paper Expo',
        date: '22/04/2026',
        type: 'Technical Association Event',
        resourcePersonCoordinator: 'Er. S. Raghavan (Chief Structural Consultant, L&T Infra)',
        participants: '140 Students across 6 Engineering Colleges',
        outcomes: 'Technical paper presentations, CAD quiz, and live concrete cube breaking competition conducted.',
        link: 'https://sseptp.org/associations/civilera-2026'
      },
      {
        event: 'Guest Lecture on Modern Mega-Infrastructure & Tunnelling Projects in India',
        date: '09/04/2026',
        type: 'Technical Guest Lecture',
        resourcePersonCoordinator: 'Dr. C. P. Reddy (Retired Chief Engineer, Indian Railways)',
        participants: '95 Civil Engineering Students',
        outcomes: 'Insightful exposure to geotechnical challenges in Himalayan railway tunnels and metro underground stations.',
        link: 'https://sseptp.org/associations/guest-lecture-tunnel'
      }
    ],
    iicCell: [
      {
        activity: 'Idea Pitch Session on Low-Cost Disaster-Resilient Housing',
        date: '16/04/2026',
        description: 'Under Institution Innovation Council (IIC 6.0), civil students pitched disaster-resistant rural dwelling designs.',
        partner: 'Andhra Pradesh State Disaster Management Authority (APSDMA)',
        beneficiaries: '75 Engineering Students & 8 Local Artisans',
        outcomes: '2 student concepts shortlisted for state incubation grant.',
        link: 'https://mic.gov.in/iic/sse-civil-pitch-2026'
      },
      {
        activity: 'Intellectual Property Rights (IPR) & Patent Drafting Workshop for Civil Innovations',
        date: '24/04/2026',
        description: 'Practical training on patent search databases, provisional drafting, and novelty claims in building materials.',
        partner: 'National Research Development Corporation (NRDC)',
        beneficiaries: '60 Students & 14 Faculty Members',
        outcomes: '4 potential provisional patent specifications formulated for department filing.',
        link: 'https://mic.gov.in/iic/ipr-civil-workshop'
      }
    ],
    syllabus: [
      {
        subject: 'Structural Analysis - II',
        yearSem: 'III B.Tech II Sem',
        faculty: 'K Siva Prasad',
        completed: '100%',
        pending: 'Nil',
        remarks: 'Completed. 2 revision sessions and previous question papers solved.'
      },
      {
        subject: 'Design of Reinforced Concrete Structures',
        yearSem: 'III B.Tech II Sem',
        faculty: 'Dr. M. Sreenivasulu',
        completed: '95%',
        pending: '5%',
        remarks: 'Retaining walls design module underway; extra classes scheduled.'
      },
      {
        subject: 'Geotechnical Engineering - I',
        yearSem: 'II B.Tech II Sem',
        faculty: 'Er. B. Ramesh',
        completed: '92%',
        pending: '8%',
        remarks: 'Direct shear and unconfined compression lab revision underway.'
      },
      {
        subject: 'Environmental Engineering & Wastewater Treatment',
        yearSem: 'III B.Tech II Sem',
        faculty: 'Er. S. Kavitha',
        completed: '100%',
        pending: 'Nil',
        remarks: 'Syllabus fully completed. Model question papers and solutions distributed.'
      }
    ]
  };
};
