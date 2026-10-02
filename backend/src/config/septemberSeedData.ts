export interface DepartmentReportEntry {
  hodName: string;
  submissionDate: string;
  sections: Record<string, any[]>;
}

export const SEPTEMBER_REPORT_DATA: Record<string, DepartmentReportEntry> = {
  'Civil Engineering': {
    hodName: 'Prof. K. Siva Prasad',
    submissionDate: '30/09/2026',
    sections: {
      journals: [
        {
          title: 'Development of eco friendly precast concrete using recycled aggregates and low carbon binders',
          authors: 'K Siva prasad',
          journalName: 'Discover Sustainability',
          issnIsbn: '2662-9984',
          volIssueYear: '',
          pageNos: '',
          indexedIn: 'Under proof reading',
          link: ''
        }
      ],
      conferences: [
        {
          title: 'Performance Assessment of Sustainable Precast Concrete Incorporating Recycled Aggregates and Low-Carbon Cement Admixtures',
          authors: 'Kummara siva prasad',
          conferenceName: 'IABSE Symposium Guwahati 2027',
          date: '22-24 April 2027',
          locationMode: 'Mayfair Spring Valley Resort, Guwahati, India/ Hybrid',
          indexedIn: 'Scopus',
          link: 'Accepted waiting fro the proof corrections'
        }
      ],
      patents: [],
      entrepreneurship: [],
      nss: [],
      fdpAttended: [],
      fdpOrganized: [],
      sdp: [
        {
          title: 'ANSYS CAE Training Program',
          type: 'Training and Internal Workshop',
          date: '21-09-2026',
          participantsCount: '7 Offline',
          resourcePerson: 'C Anil Kuma Reddy, ME, Sanskrithi',
          coordinator: 'C Anil Kuma Reddy',
          keyOutcomes: 'PO1: Multiphysics Simulation Workflow Execution: Set up, mesh, execute solvers, and post-process linear static structural, transient dynamic, modal/harmonic vibration, thermal, Fluent CFD, and composite laminate simulations in ANSYS Workbench. PO2: Simulation Verification & Audit Standards: Mathematically verify static force equilibrium (ΣF_applied + ΣF_reaction = 0), differentiate true stresses from stress singularities, and execute mesh convergence studies ensuring <5% stress variation across mesh refinements. PO3: Specific Industrial Problem',
          mode: 'Offline',
          link: ''
        }
      ],
      facultyAchievements: [],
      studentAchievements: [],
      certifications: [],
      deptMeetings: [],
      mous: [],
      additionalInitiatives: [],
      techAssociation: [],
      iicCell: [],
      syllabus: [
        { subject: 'GRES', yearSem: '4-1', faculty: 'K Siva prasad', completed: '1,2,3,4', pending: '5-80%', remarks: '-' },
        { subject: 'Management Science', yearSem: '4-1', faculty: 'Mr. Anju Verma', completed: 'I,II,III Units Completed', pending: 'IV Unit', remarks: '-' },
        { subject: 'Ground improvement techniques', yearSem: '4-1', faculty: 'Dr J Surya Prakash reddy', completed: '1,2,3,4', pending: '5 Started', remarks: '-' },
        { subject: 'Finite element analysis', yearSem: '4-1', faculty: 'Mr. E Sai Kumar Reddy', completed: '1,2,3 Units Completed, 4 Unit Started', pending: '5', remarks: '-' },
        { subject: 'Chemistry of Nano materials', yearSem: '4-1', faculty: 'Dr B sambasivaah', completed: '1,2,3,4', pending: '5', remarks: '-' },
        { subject: '3D Printing Technologies', yearSem: '4-1', faculty: 'Mr B Pardeep Kumar', completed: '1,2,3 Units Completed, 4 Unit 75% Complete', pending: '5 Unit', remarks: '-' },
        { subject: 'Environmental Impact assessment', yearSem: '3-1', faculty: 'Mr. K Siva prasad', completed: '1,2,3,4', pending: '5-60%', remarks: '-' },
        { subject: 'Geotechnical Engineering', yearSem: '3-1', faculty: 'Dr J Surya Prakash reddy', completed: '1,2,3,4', pending: '5-50%', remarks: '-' },
        { subject: 'Design of Reinforced concrete structures', yearSem: '3-1', faculty: 'Mr. P Tharun Kumar', completed: '1,2,3', pending: '4-20% and 5', remarks: '-' },
        { subject: 'Chemistry for Energy Systems', yearSem: '3-1', faculty: 'Dr. B. Sambasiva', completed: '1,2,3,4-50%', pending: '5', remarks: '-' },
        { subject: 'Introduction to Quantum Technologies and Applications', yearSem: '3-1', faculty: 'Mr. M. Vamsi krishna', completed: '1,2,3 Units Completed', pending: '4,5', remarks: '-' },
        { subject: 'Water Resources engineering', yearSem: '3-1', faculty: 'Mr. E.Saikumar reddy', completed: '1,2,3Unit 90% Complete', pending: '4,5 Unit', remarks: '-' },
        { subject: 'Surveying', yearSem: '2-1', faculty: 'Dr J Surya Prakash reddy', completed: '1,2,3,4', pending: '5', remarks: '-' },
        { subject: 'FLUID MECHANICS', yearSem: '2-1', faculty: 'Mr.K Siva prasad', completed: '1,2,3,4', pending: '5-60%', remarks: '-' },
        { subject: 'Universal Human Values-Understanding Harmony& Ethical Human Conduct', yearSem: '2-1', faculty: 'Mr.P Gousal Azam', completed: '1,2,3', pending: '4,5', remarks: '-' },
        { subject: 'Numerical Methods & Transform Techniques', yearSem: '2-1', faculty: 'Mr. M. Yaswanth Sai', completed: '1,2,3,4-50%', pending: '5', remarks: '-' },
        { subject: 'Strength of materials', yearSem: '2-1', faculty: 'Mr P Tharun Kumar', completed: '1,2,3,4-50%', pending: '5', remarks: '-' }
      ]
    }
  },

  'Computer Science & Engineering': {
    hodName: 'Dr. Kethineni Vinod Kumar',
    submissionDate: '30/09/2026',
    sections: {
      journals: [],
      conferences: [
        {
          title: 'An Intelligent IoT-Connected Buck-Boost Converter for Advanced DC Power Management',
          authors: 'Dr.K.Vinod Kumar',
          conferenceName: '10th international conference on inventive systems and control (ICISC 2026)',
          date: '5-7 Aug 2026',
          locationMode: 'hybrid',
          indexedIn: 'Scopus',
          link: ''
        },
        {
          title: 'MelodyForge: A Context-Adaptive Hierarchical Neural Framework for Automatic Symbolic Music Generation through Multi-Level Musical Representation Learning',
          authors: 'Dr. N.Ramesh babu',
          conferenceName: '7th International Conference on Computational Vision and Bio Inspired Computing (ICCVBIC 2026)',
          date: '6-8 August 2026',
          locationMode: 'online',
          indexedIn: 'Scopus',
          link: ''
        },
        {
          title: 'Multimodal facial feature fusion and deep learning for robust stress detection in IT professionals',
          authors: 'Dr.K. Vinod Kumar',
          conferenceName: '10th International Conference on Electronics, Communication and Aerospace Technology ICECA 2026',
          date: '',
          locationMode: 'hybrid',
          indexedIn: 'Scopus',
          link: ''
        },
        {
          title: 'AI-Driven Intelligent Systems for Next-Generation Computing Applications',
          authors: 'Dr.K.Vinod Kumar',
          conferenceName: '5th International Conference on Automation, Computing and Renewable Systems (ICACRS 2026)',
          date: '2-4, December 2026',
          locationMode: 'hybrid',
          indexedIn: 'Scopus',
          link: ''
        },
        {
          title: 'Deep Learning-Based Cybersecurity Framework for Real-Time Threat Detection',
          authors: 'N. Ramesh Babu',
          conferenceName: '10th International Conference on Electronics, Communication and Aerospace Technology (ICECA 2026)',
          date: '26-28, October 2026',
          locationMode: 'hybrid',
          indexedIn: 'Scopus',
          link: ''
        },
        {
          title: 'Cloud and Edge Computing Architecture for Scalable Smart Applications',
          authors: 'P. Yuva Teja',
          conferenceName: '10th International Conference on Electronics, Communication and Aerospace Technology (ICECA 2026)',
          date: '26-28, October 2026',
          locationMode: 'hybrid',
          indexedIn: 'Scopus',
          link: ''
        },
        {
          title: 'Blockchain-Enabled Secure Data Management for Distributed Systems',
          authors: 'P. Ajay Krishna',
          conferenceName: '10th International Conference on Electronics, Communication and Aerospace Technology (ICECA 2026)',
          date: '26-28, October 2026',
          locationMode: 'hybrid',
          indexedIn: 'Scopus',
          link: ''
        },
        {
          title: 'Machine Learning-Based Predictive Analytics for Intelligent Decision',
          authors: 'K. Vinod Kumar',
          conferenceName: '6th International Conference on Ubiquitous Computing and Intelligent Information Systems (ICUIS 2026)',
          date: '28-30 October, 2026',
          locationMode: 'hybrid',
          indexedIn: 'Scopus',
          link: ''
        },
        {
          title: 'Quantum Computing Approaches for Complex Optimization Problems',
          authors: 'P. Maruthi',
          conferenceName: '11th International Conference on Communication and Electronics Systems (ICCES 2026)',
          date: '14-16, October 2026',
          locationMode: 'hybrid',
          indexedIn: 'Scopus',
          link: ''
        },
        {
          title: 'Federated Learning for Privacy-Preserving Distributed Intelligence',
          authors: 'K. Dharmendra',
          conferenceName: '10th International Conference on Electronics, Communication and Aerospace Technology (ICECA 2026)',
          date: '26-28, October 2026',
          locationMode: 'hybrid',
          indexedIn: 'Scopus',
          link: ''
        },
        {
          title: 'Agentic AI-Based Autonomous Workflow Orchestration for Adaptive Enterprise Systems',
          authors: 'M. V. Lakshmi Prasanna',
          conferenceName: '10th International Conference on Electronics, Communication and Aerospace Technology (ICECA 2026)',
          date: '26-28, October 2026',
          locationMode: 'hybrid',
          indexedIn: 'Scopus',
          link: ''
        },
        {
          title: 'TinyML-Enabled Edge Intelligence for Low-Power Predictive Monitoring Systems',
          authors: 'B. Maheswar Reddy',
          conferenceName: '6th International Conference on Ubiquitous Computing and Intelligent Information Systems (ICUIS 2026)',
          date: '26-28, October 2026',
          locationMode: '',
          indexedIn: 'Scopus',
          link: ''
        },
        {
          title: 'Privacy-Preserving Synthetic Data Generation Using Diffusion Models for Sensitive Applications',
          authors: 'G. Harinadha Reddy',
          conferenceName: '6th International Conference on Ubiquitous Computing and Intelligent Information Systems (ICUIS 2026)',
          date: '26-28, October 2026',
          locationMode: '',
          indexedIn: 'Scopus',
          link: ''
        },
        {
          title: 'Lightweight Hybrid Deep Learning Model for Real-Time Phishing Website Detection Using URL and Behavioral Features',
          authors: 'S. Noor Mohammed',
          conferenceName: '5th International Conference on Automation, Computing and Renewable Systems (ICACRS 2026)',
          date: '2-4, December 2026',
          locationMode: '',
          indexedIn: 'Scopus',
          link: ''
        }
      ],
      patents: [],
      entrepreneurship: [],
      nss: [],
      fdpAttended: [
        {
          title: 'Six Days Faculty Development Programme on "AI-Enabled Software Engineering: Intelligent Development, Testing & Automation"',
          type: 'FDP',
          dates: '15 to 21 2026. ()',
          organizingBody: 'Mount Zion College of Engineering and the Department Of Computer Science and Engineering',
          mode: 'Online',
          facultyAttended: 'Dr.K.Vinod kumar',
          link: ''
        }
      ],
      fdpOrganized: [
        {
          title: 'Six Days Faculty Development Programme on "AI-Enabled Software Engineering: Intelligent Development, Testing & Automation"',
          type: 'FDP',
          dates: '15 to 21 2026. ()',
          deptOrganized: 'Computer Science & Engineering',
          mode: 'Online',
          resourcePersonDetails: 'Dr.K.Vinod kumar',
          facultyCoordinators: '',
          link: ''
        }
      ],
      sdp: [],
      facultyAchievements: [],
      studentAchievements: [
        {
          nameRoll: 'G. R Tejaswini',
          award: 'DRDO',
          event: 'Internship (DRDO, ADE, Banglore)',
          organization: 'DRDO, ADE, Bangalore',
          durationDate: '',
          link: ''
        },
        {
          nameRoll: 'Nookala Manikanta 4th year CSE-B 2. Nasankora Pravalika 4th year CSE-B 3. D. Kullayappa 3rd year CSE-C 4. Monisha 3rd year CSE-C',
          award: '1st prize in Hackathon',
          event: 'HACKATHON, IGNITRON2K26, National Level Technical Symposium (BEST UNIVERSITY)',
          organization: 'BEST University',
          durationDate: '',
          link: ''
        }
      ],
      certifications: [
        {
          title: 'ServiceNow Global Certification Exam',
          platform: 'Guna sai, Type: ServiceNow CAD,CSA',
          type: 'ServiceNow CAD, CSA',
          duration: '28 days',
          enrolled: '27',
          certified: 'Students Certified',
          keyOutcomes: 'Certified students became eligible to participate in hackathons organized by leading companies such as Accenture and Deloitte, providing valuable opportunities for industry exposure, skill development, and placements',
          link: ''
        }
      ],
      deptMeetings: [],
      mous: [
        {
          name: 'MongoDB',
          purpose: 'MongoDB Industry Immersion day',
          datePeriod: '29th Aug 2026',
          facultySpoc: 'A.S.K. Viswas',
          link: ''
        }
      ],
      additionalInitiatives: [],
      techAssociation: [],
      iicCell: [],
      syllabus: [
        { subject: 'Artificial Intelligence', yearSem: '3-1', faculty: 'Mr. P. Ajay Krishna', completed: '3', pending: '', remarks: '-' },
        { subject: 'Computer Networks & Internet Protocol', yearSem: '3-1', faculty: 'Dr. K. Vinod kumar', completed: '3.5', pending: '', remarks: '-' },
        { subject: 'Automata Theory and Compiler Design', yearSem: '3-1', faculty: 'Mr. Srinivasa Prasad', completed: '3', pending: '', remarks: '-' },
        { subject: 'Object Oriented Analysis and Design', yearSem: '3-1', faculty: 'Mr. P Yuvateja', completed: '3', pending: '', remarks: '-' },
        { subject: 'Introduction to Quantum Technologies & Applications', yearSem: '3-1', faculty: 'Mr. Vamsi krishna', completed: '3', pending: '', remarks: '-' },
        { subject: 'Computer Networks & Internet Protocol', yearSem: '3-1', faculty: 'Ms. C. Girisha', completed: '3', pending: '', remarks: '-' },
        { subject: 'Automata Theory and Compiler Design', yearSem: '3-1', faculty: 'Mr S. Noormohammed', completed: '3.5', pending: '', remarks: '-' },
        { subject: 'Deep Learning', yearSem: '4-1', faculty: 'Ms. A. Vyshnavi', completed: '4', pending: '', remarks: '-' },
        { subject: 'Internet of Things', yearSem: '4-1', faculty: 'Mr. G. Harinadha Reddy', completed: '3.5', pending: '', remarks: '-' },
        { subject: 'Computer Vision', yearSem: '4-1', faculty: 'Mr Srinivasa Prasad', completed: '4', pending: '', remarks: '-' },
        { subject: 'Prompt Engineering', yearSem: '4-1', faculty: 'Mr. P. Maruthi', completed: '4', pending: '', remarks: '-' },
        { subject: 'Solid Waste Management', yearSem: '4-1', faculty: 'Mr. K. Siva Prasad', completed: '4', pending: '', remarks: '-' },
        { subject: 'DISCRETE MATHEMATICS & GRAPH THEORY', yearSem: '2-1', faculty: 'Mr. Yeswanth', completed: '3', pending: '', remarks: '-' },
        { subject: 'ADVANCED DATA STRUCTURES & ALGORITHM ANALYSIS', yearSem: '2-1', faculty: 'Mr. K. Dharmendra', completed: '3.5', pending: '', remarks: '-' },
        { subject: 'OBJECT-ORIENTED PROGRAMMING THROUGH JAVA', yearSem: '2-1', faculty: 'Ms. C Chandana', completed: '3', pending: '', remarks: '-' },
        { subject: 'OBJECT-ORIENTED PROGRAMMING THROUGH JAVA', yearSem: '2-1', faculty: 'P.maruthi', completed: '4', pending: '', remarks: '-' },
        { subject: 'PYTHON PROGRAMMING-Skill oriented', yearSem: '2-1', faculty: 'Ms. M. V Laxmi Prasanna', completed: '4', pending: '', remarks: '-' },
        { subject: 'UNIVERSAL HUMAN VALUES', yearSem: '2-1', faculty: 'Mr. Anuj Verma', completed: '4', pending: '', remarks: '-' },
        { subject: 'DIGITAL LOGIC AND COMPUTER ORGANIZATION', yearSem: '2-1', faculty: 'Mr. Rajesh', completed: '4', pending: '', remarks: '-' },
        { subject: 'ENVIRONMENTAL SCIENCE', yearSem: '2-1', faculty: 'Mr. K. Sai kumar Reddy', completed: '3', pending: '', remarks: '-' },
        { subject: 'PYTHON PROGRAMMING-', yearSem: '2-1', faculty: 'Dr. N. Ramesh Babu', completed: '4', pending: '', remarks: '-' }
      ]
    }
  },

  'Electronics & Communication Engineering': {
    hodName: 'Dr. V. Annapurna',
    submissionDate: '30/09/2026',
    sections: {
      journals: [],
      conferences: [],
      patents: [],
      entrepreneurship: [],
      nss: [],
      fdpAttended: [
        {
          title: 'Six-Week Capacity Building & Wellness Program - "Enabling Efficiency & Effectiveness"',
          type: 'Workshop',
          organizingBody: 'Dean Academics',
          dates: '26-09-2026 (Offline)',
          mode: 'Offline',
          facultyAttended: 'Dr. V. Annapurna, Ms. D.V. Supriya, Mr. M. Rajesh',
          link: ''
        }
      ],
      fdpOrganized: [],
      sdp: [],
      facultyAchievements: [],
      studentAchievements: [],
      certifications: [],
      deptMeetings: [],
      mous: [],
      additionalInitiatives: [],
      techAssociation: [],
      iicCell: [],
      syllabus: [
        { subject: 'Probability and Complex Variables', yearSem: 'II/I', faculty: 'Dr. Lavanya', completed: '2 Units Completed', pending: '3 Unit Running', remarks: '-' },
        { subject: 'Universal Human Values', yearSem: 'II/I', faculty: 'Mr. Azam', completed: '3 Units Completed', pending: '4 Unit Running', remarks: '-' },
        { subject: 'Signals, Systems and Stochastic Processes', yearSem: 'II/I', faculty: 'Mr. B. Venkatesu', completed: '2 Units Completed', pending: '3 Unit Running', remarks: '-' },
        { subject: 'Electronic Devices and Circuits', yearSem: 'II/I', faculty: 'Electronic Devices and Circuits', completed: '2 Units Completed', pending: '3 Unit Running', remarks: '-' },
        { subject: 'Digital Circuits Design', yearSem: 'II/I', faculty: 'Dr. V. Annapurna', completed: '3 Units Completed', pending: '4 Unit Running', remarks: '-' },
        { subject: 'Analog and Digital IC Applications', yearSem: 'III/I', faculty: 'Mr. B. Venkatesu', completed: '2 Units Completed', pending: '3 Unit Running', remarks: '-' },
        { subject: 'Antennas & Wave Propagation', yearSem: 'III/I', faculty: 'Prof. D. Nagaraju', completed: '2 Units Completed', pending: '3 Unit Running', remarks: '-' },
        { subject: 'Microprocessors and Microcontrollers', yearSem: 'III/I', faculty: 'Ms. D.V. Supriya', completed: '3 Units Completed', pending: '4 Unit Running', remarks: '-' },
        { subject: 'Introduction To Quantum Technologies and Applications', yearSem: 'III/I', faculty: 'Mr. M. Rajesh', completed: '3 Units Completed', pending: '4 Unit Running', remarks: '-' },
        { subject: 'Computer Architecture & Organization', yearSem: 'III/I', faculty: 'Mr. R. Vijaya Ramaraju', completed: '3 Units Completed', pending: '4 Unit Running', remarks: '-' },
        { subject: 'Electrical Safety Practices and Standards', yearSem: 'III/I', faculty: 'Mr. K. Gangadhar', completed: '3 Units Completed', pending: '4 Unit Running', remarks: '-' },
        { subject: 'Data Communications and Networking', yearSem: 'IV/I', faculty: 'Mr. R. Vijaya Ramraj', completed: '3 Units Completed', pending: '4 Unit Running', remarks: '-' },
        { subject: 'Management Science', yearSem: 'IV/I', faculty: 'Mr. M. Vedavyas', completed: '2 Units Completed', pending: '3 Unit Running', remarks: '-' },
        { subject: 'Radar Engineering', yearSem: 'IV/I', faculty: 'Prof. D. Nagaraju', completed: '4 Units Completed', pending: '5 Unit Running', remarks: '-' },
        { subject: '5G Communications', yearSem: 'IV/I', faculty: 'Prof. D. Nagaraju', completed: '1 Unit Completed', pending: '2 Unit Running', remarks: '-' },
        { subject: 'Building Materials & Services', yearSem: 'IV/I', faculty: 'Mr. Sai Kumar Reddy', completed: '2 Units Completed', pending: '3 Unit Running', remarks: '-' },
        { subject: 'Internet of Things', yearSem: 'IV/I', faculty: 'Dr. V. Annapurna', completed: '2 Units Completed', pending: '3 Unit Running', remarks: '-' }
      ]
    }
  },

  'Electrical & Electronics Engineering': {
    hodName: 'Dr. Naarisetti Srinivasa Rao',
    submissionDate: '30/09/2026',
    sections: {
      fdp: [
        {
          link: '',
          mode: 'Online',
          role: 'Dr. Naarisetti Srinivasa Rao(Attendee)',
          type: 'FDP',
          dates: '05/09/2026-06/09/2026 ',
          title: 'OBE TO EXCELLENCE',
          keyOutcomes: 'Outcome Based Education, how to calculate COS & POS',
          organizingBody: 'WOW Light Signal AI Academy'
        },
        {
          link: '',
          mode: 'ONLINE',
          role: 'Dr. Naarisetti Srinivasa Rao(Attendee)',
          type: 'FDP',
          dates: '31/08/2026-04/09/2026',
          title: 'AI Powered Pedagogy',
          keyOutcomes: 'Innovative Digital Strategies for Educators',
          organizingBody: 'Manusciptindia'
        }
      ],
      nss: [
        {
          date: '15/09/2026',
          link: '',
          type: 'Projects Expo',
          event: 'Projects Expo',
          venue: 'SKU. ANANTHAPURAMU',
          outcomes: 'Participation Certificate',
          coordinator: 'Mr. K. Gangadhar',
          participantsCount: '15',
          typeOfParticipants: 'students participated'
        }
      ],
      sdp: [],
      mous: [],
      iicCell: [
        {
          date: '24/09/2026',
          link: 'https://drive.google.com/drive/folders/1Rn2EwmUFhr2TQUAatjrtJomakO1jCbCc?usp=drive_link',
          partner: 'Mr. P. Dhanjnjaya',
          activity: 'Innovation Day – Student Innovation & Prototype Challenge ',
          outcomes: 'dynamic learning experience and offered multiple academic, technical, and professional benefits to participating students:',
          description: 'dynamic learning experience and offered multiple academic, technical, and professional benefits to participating students:',
          beneficiaries: '7 faculty and 200 students participated'
        },
        {
          date: '25/09/2026',
          link: 'https://drive.google.com/drive/folders/1Rn2EwmUFhr2TQUAatjrtJomakO1jCbCc?usp=drive_link',
          partner: 'P. Ajay Kumar',
          activity: 'SEVA FIRST INNOVATION CHALLENGE (SFIC)',
          outcomes: 'Innovation Exposure: Students gain exposure to a national initiative focused on practical problem-solving and innovation',
          description: 'Webinar, Innovation Exposure: Students gain exposure to a national initiative focused on practical problem-solving and innovation',
          beneficiaries: '3 Faculty Members; 60 Students'
        }
      ],
      patents: [],
      journals: [
        {
          link: 'https://doi.org/10.1063/5.0317101',
          title: 'IoT-Based Low-Cost Smart Egg Incubator for Poultry Farms',
          authors: 'Mr. P. Dhanunjaya',
          pageNos: '10',
          issnIsbn: 'ISSN 1551-7616',
          indexedIn: 'scopus',
          journalName: 'API Conference',
          volIssueYear: 'issue 1, volume 3341'
        }
      ],
      syllabus: [
        {
          faculty: 'Mrs. R. M. Lavanya',
          pending: '',
          remarks: '',
          subject: 'Complex Variables & Numerical Methods',
          yearSem: 'II EEE, SEM 1',
          completed: '80%'
        },
        {
          faculty: 'Mr. P. Gousal Azam',
          pending: '',
          remarks: '',
          subject: 'Universal Human Values- Understanding Harmony',
          yearSem: 'II EEE, SEM 1',
          completed: '70%'
        },
        {
          faculty: 'Mr. N Pavan Kumar',
          pending: '',
          remarks: '',
          subject: 'Electromagnetic Field Theory',
          yearSem: 'II EEE, SEM 1',
          completed: '100%'
        },
        {
          faculty: 'Mrs. P. Prathyusha',
          pending: '',
          remarks: '',
          subject: 'Electrical Circuit Analysis-II',
          yearSem: 'II EEE, SEM 1',
          completed: '80%'
        },
        {
          faculty: 'Dr. N. Srinivasa Rao',
          pending: '',
          remarks: '',
          subject: 'Electrical Circuit Analysis-II and Simulation Lab',
          yearSem: 'II EEE, SEM 1',
          completed: '84%'
        },
        {
          faculty: 'Mr. P. Dhanunjaya',
          pending: '',
          remarks: '',
          subject: 'DC Machines & Transformers',
          yearSem: 'II EEE, SEM 1',
          completed: '98%'
        },
        {
          faculty: 'Mr. N. Pavan Kumar',
          pending: '',
          remarks: '',
          subject: 'DC Machines & Transformers Lab',
          yearSem: 'II EEE, SEM 1',
          completed: '100%'
        },
        {
          faculty: 'Ms. C. Girisha',
          pending: '',
          remarks: '',
          subject: 'Data Structures',
          yearSem: 'II EEE, SEM 1',
          completed: '50%'
        },
        {
          faculty: 'Ms. Chndhana',
          pending: '',
          remarks: '',
          subject: 'Python Programming-Development Hour',
          yearSem: 'II EEE, SEM 1',
          completed: '75%'
        },
        {
          faculty: 'Dr. N. Srinivasa Rao',
          pending: '',
          remarks: '',
          subject: 'Utilisation of Electrical Energy',
          yearSem: 'III EEE, SEM 1',
          completed: '80%, 4 units '
        },
        {
          faculty: 'Mrs. P. Prathyusha',
          pending: '',
          remarks: '',
          subject: 'Power Electronics',
          yearSem: 'III EEE, SEM 1',
          completed: 'unit 4, 80%'
        },
        {
          faculty: 'Dr. S Harikrishnan',
          pending: '',
          remarks: '',
          subject: 'Digital Circuits',
          yearSem: 'III EEE, SEM 1',
          completed: '60%'
        },
        {
          faculty: 'Mr. K. Ramu',
          pending: '',
          remarks: '',
          subject: 'Power Systems-II',
          yearSem: 'III EEE, SEM 1',
          completed: '70%'
        },
        {
          faculty: 'Mr. G. Vamsi Krishna',
          pending: '',
          remarks: '',
          subject: 'Introduction To Quantum Technologies and Applications',
          yearSem: 'III EEE, SEM 1',
          completed: '60%'
        },
        {
          faculty: 'Mr. P.Dhanujaya',
          pending: '',
          remarks: '',
          subject: 'Entrepreneurship and New Venture Creation(OE-1)',
          yearSem: 'III EEE, SEM 1',
          completed: '95%'
        },
        {
          faculty: 'Mr. K. Ramu',
          pending: '',
          remarks: '',
          subject: 'ELECTRICAL DISTRIBUTION SYSTEMS',
          yearSem: 'III EEE, SEM 1',
          completed: '80%'
        },
        {
          faculty: 'Mr. Gangadhar',
          pending: '',
          remarks: '',
          subject: 'POWER SYSTEM OPERATION AND CONTROL',
          yearSem: 'IV EEE, 1 SEM',
          completed: '60%'
        },
        {
          faculty: 'Mr. S. HARI KRISHNAN',
          pending: '',
          remarks: '',
          subject: 'DIGITAL SIGNAL PROCESSING',
          yearSem: 'IV EEE, 1 SEM',
          completed: '70%'
        },
        {
          faculty: 'Mr. G. RAMAMOHAN',
          pending: '',
          remarks: '',
          subject: 'SOLID WASTE MANAGEMENT',
          yearSem: 'IV EEE, 1 SEM',
          completed: '90%'
        },
        {
          faculty: 'Mr. ANUJ VERMA',
          pending: '',
          remarks: '',
          subject: 'MANAGEMNET SCIENCE',
          yearSem: 'IV EEE, 1 SEM',
          completed: '70%'
        },
        {
          faculty: 'Ms. VAISHNAVI',
          pending: '',
          remarks: '',
          subject: 'CYBER SECURITY',
          yearSem: 'IV EEE, 1 SEM',
          completed: '90%'
        },
        {
          faculty: 'Mr. K. HARI PRASAD',
          pending: '',
          remarks: '',
          subject: 'SOFT SKILLS',
          yearSem: 'IV EEE, 1 SEM',
          completed: 'GENERAL TOPICS COMPLETED AS PER SYLLABUS'
        },
        {
          faculty: 'K. Gangadhar',
          pending: '',
          remarks: '',
          subject: 'PSS LAB',
          yearSem: 'IV EEE, 1 SEM',
          completed: '6 experiment completed'
        },
        {
          faculty: 'Mr. VISWAS',
          pending: '',
          remarks: '',
          subject: 'APTITUTE',
          yearSem: 'IV EEE, 1 SEM',
          completed: 'GENERAL TOPICS  REASONING AND QUANTITATIVE COMPLETED AS PER SYLLABUS'
        }
      ],
      conferences: [],
      deptMeetings: [],
      certifications: [],
      techAssociation: [],
      entrepreneurship: [],
      facultyAchievements: [
        {
          date: '05/09/2026',
          link: 'https://drive.google.com/drive/folders/1Rn2EwmUFhr2TQUAatjrtJomakO1jCbCc?usp=drive_link',
          name: 'Dr. NAARISETTI SRINIVASA RAO',
          award: 'BEST ACADEMICIAN AWARD',
          organization: 'Xavier Institute of Research and Development'
        },
        {
          date: '16/08/2026',
          link: '',
          name: 'Dr. NAARISETTI SRINIVASA RAO',
          award: 'Advisory Committee Member For am International Conference',
          organization: 'ICET-2026'
        }
      ],
      studentAchievements: [],
      additionalInitiatives: [
        {
          date: '11/09/2026',
          link: 'https://drive.google.com/drive/folders/1Rn2EwmUFhr2TQUAatjrtJomakO1jCbCc?usp=drive_link',
          outcomes: 'The visit to PABR Hydro Power Plant was a valuable educational experience that successfully connected classroom learning with real-world industrial applications. Students gained practical exposure to hydroelectric power generation, turbines, generators, substations, switchgear, control panels, protection systems and auxiliary equipment. The visit strengthened our understanding of Power Systems and Electrical Engineering and encouraged us to explore the practical and professional aspects of the field. “True learning becomes meaningful when theoretical knowledge meets real-world application.”',
          initiative: 'INDUSTRIAL VISIT, PABR Hydro Power Plant, 25 II EEE STUDENTS',
          coordinator: 'Mr. P. Dhanunjaya, Mrs. Pratyusha',
          description: 'The industrial visit was an informative and enriching learning experience for all participating students. The explanations provided by the plant officials helped students develop a clearer understanding of the practical aspects of power generation and electrical engineering. Observing actual equipment made the concepts studied through textbooks and classroom diagrams easier to understand.'
        }
      ]
    }
  },

  'Mechanical Engineering': {
    hodName: 'Prof. C. Anil Kumar Reddy',
    submissionDate: '30/09/2026',
    sections: {
      journals: [],
      conferences: [],
      patents: [],
      entrepreneurship: [],
      nss: [],
      fdpAttended: [],
      fdpOrganized: [],
      sdp: [],
      facultyAchievements: [],
      studentAchievements: [],
      certifications: [],
      deptMeetings: [],
      mous: [],
      additionalInitiatives: [],
      techAssociation: [],
      iicCell: [],
      syllabus: [
        { subject: 'Numerical Methods &Transform Techniques', yearSem: '2-1', faculty: 'Mr. M. Yaswanth Sai', completed: 'I Unit Complete, II Unit Completed', pending: 'III Unit 30% complete', remarks: '-' },
        { subject: 'Universal Human Values-Understanding Harmony& Ethical Human Conduct', yearSem: '2-1', faculty: 'Mr.P Gousal Azam', completed: 'I,II Units Completed,', pending: 'III Unit Started', remarks: '-' },
        { subject: 'Thermodynamics', yearSem: '2-1', faculty: 'Mr. P. Pradeep Kumar', completed: 'I,II Units Completed', pending: 'III Unit Started', remarks: '-' },
        { subject: 'Mechanics of Solids', yearSem: '2-1', faculty: 'Mr. G. Vasikerappa', completed: 'I,II Units (70%)', pending: 'III Unit 30%', remarks: '-' },
        { subject: 'Material Science and Metallurgy', yearSem: '2-1', faculty: 'Mr.G.Sudhakar', completed: 'I, II, III Unit', pending: 'III Unit 90% Complete', remarks: '-' },
        { subject: 'Machining Process', yearSem: '3-1', faculty: 'Mr. C. Anil Kumar Reddy', completed: 'I,II Units Completed', pending: 'III Unit 30% Completed', remarks: '-' },
        { subject: 'Thermal Engineering', yearSem: '3-1', faculty: 'Mr. P. Pradeep Kumar', completed: 'I,II Units Completed', pending: 'III Unit Started 30%', remarks: '-' },
        { subject: 'Metrology and Measurements', yearSem: '3-1', faculty: 'Mr. G. Sudhakar', completed: 'I, II, III Unit 90% Complete', pending: 'III Unit 90% Complete', remarks: '-' },
        { subject: 'Chemistry for Energy Systems', yearSem: '3-1', faculty: 'Dr. B. Sambasiva', completed: 'I,II, III Units Completed', pending: 'IV Started', remarks: '-' },
        { subject: 'Introduction to Quantum Technologies and Applications', yearSem: '3-1', faculty: 'Mr. M. Rajesh', completed: 'I,II,III Units Completed', pending: 'IV Started', remarks: '-' },
        { subject: 'AI & ML for Mechanical Engineering', yearSem: '4-1', faculty: 'Mr. C. Anil Kumar Reddy', completed: 'I,II Units Completed, III Unit Started', pending: 'III Unit Started', remarks: '-' },
        { subject: 'Management Science', yearSem: '4-1', faculty: 'Mr. Anju Verma', completed: 'I,II,III Units Completed', pending: 'IV Started', remarks: '-' },
        { subject: 'Power Plant Engineering', yearSem: '4-1', faculty: 'Mr. G. Vasikerappa', completed: 'I,II,III Units Completed', pending: 'IV Started', remarks: '-' },
        { subject: 'Non-Destructive Testing', yearSem: '4-1', faculty: 'Mr. C. Anil Kumar Reddy', completed: 'I,II Units Completed', pending: 'III Unit Started', remarks: '-' },
        { subject: 'Building Materials and Services', yearSem: '4-1', faculty: 'Mr. P. Tarun Kumar', completed: 'I, II,III Units Completed', pending: 'IV Started', remarks: '-' },
        { subject: 'Electric Vehicles', yearSem: '4-1', faculty: 'Dr.N. Srinivasa Rao', completed: 'I,II,III Units Completed, IV Unit 75% Complete', pending: 'IV Unit 75% Complete', remarks: '-' }
      ]
    }
  },

  'Humanities & Sciences': {
    hodName: 'Dr. Samba Sivaiah B',
    submissionDate: '30/09/2026',
    sections: {
      journals: [
        {
          title: 'Bioengineered Co3O4/Ag electrochemical sensor: a sustainable approach for antibiotic sensing in food samples',
          authors: 'Reddy Prasad Puthalapattu, Sandhya Punyasamudram, Haripriya T, Naveen Kilari, Sambasivaiah B & Anitha Rani V',
          journalName: 'Journal of Interactions (Volume 247, Issue 427 (2026))',
          issnIsbn: '3005-0731',
          volIssueYear: '247/427',
          pageNos: '',
          indexedIn: 'Springer Nature',
          link: 'https://link.springer.com/article/10.1007/s10751-026-02758-6'
        }
      ],
      conferences: [],
      patents: [],
      entrepreneurship: [],
      nss: [],
      fdpAttended: [],
      fdpOrganized: [],
      sdp: [],
      facultyAchievements: [],
      studentAchievements: [],
      certifications: [],
      deptMeetings: [],
      mous: [],
      additionalInitiatives: [
        {
          initiative: 'Orientation Programme',
          date: '1st sept 2026 to 11th sept 2026',
          coordinator: 'All HAS Faculty',
          description: 'Orientation Programme for First Year Engineering Students',
          outcomes: '',
          link: ''
        }
      ],
      techAssociation: [],
      iicCell: [],
      syllabus: []
    }
  },

  'Innovation & Entrepreneurship': {
    hodName: 'Dean / Convener - IIC & EDC',
    submissionDate: '30/09/2026',
    sections: {
      journals: [],
      conferences: [],
      patents: [],
      entrepreneurship: [
        {
          title: 'Transforming student ideas into entrepreneurial opportunities',
          date: '07/09/2026',
          type: 'Mentoring Session',
          participants: '180 parts',
          organizedBy: 'I & E Cell',
          mode: 'offline',
          keyOutcomes: 'Completed',
          participantsCount: '180',
          mentorCoordinator: 'I & E Cell',
          status: 'Completed',
          link: ''
        },
        {
          title: 'SevaSpark-Igniting Innovation For Society',
          date: '25/09/2026',
          type: 'Webinar',
          participants: '60 parts',
          organizedBy: 'I & E Cell',
          mode: 'offline',
          keyOutcomes: 'Completed',
          participantsCount: '60',
          mentorCoordinator: 'I & E Cell',
          status: 'Completed',
          link: ''
        },
        {
          title: 'Igniting Ideas and Innovation-InnoSpark',
          date: '24/09/2026',
          type: 'Mentorship',
          participants: '200 parts',
          organizedBy: 'I & E Cell',
          mode: 'Offline',
          keyOutcomes: 'Completed',
          participantsCount: '200',
          mentorCoordinator: 'I & E Cell',
          status: 'Completed',
          link: ''
        },
        {
          title: 'Ecoinnovate-Innovation For sustainable Development',
          date: '28/09/2026',
          type: 'Workshop',
          participants: '180 parts',
          organizedBy: 'I & E Cell',
          mode: 'Offline',
          keyOutcomes: 'Completed',
          participantsCount: '180',
          mentorCoordinator: 'I & E Cell',
          status: 'Completed',
          link: ''
        }
      ],
      nss: [],
      fdpAttended: [],
      fdpOrganized: [],
      sdp: [],
      facultyAchievements: [],
      studentAchievements: [],
      certifications: [],
      deptMeetings: [],
      mous: [],
      additionalInitiatives: [],
      techAssociation: [],
      iicCell: [],
      syllabus: []
    }
  },

  'Student Engagement & Clubs': {
    hodName: 'Convener - Student Engagement & Clubs',
    submissionDate: '30/09/2026',
    sections: {
      journals: [],
      conferences: [],
      patents: [],
      entrepreneurship: [],
      nss: [],
      fdpAttended: [],
      fdpOrganized: [],
      sdp: [],
      facultyAchievements: [],
      studentAchievements: [],
      certifications: [],
      deptMeetings: [],
      mous: [],
      additionalInitiatives: [],
      techAssociation: [],
      iicCell: [],
      syllabus: [],
      studentEngagement: [
        {
          title: 'Hands-on Full-Stack AI & Cloud Web Development Bootcamp',
          type: 'Workshop',
          otherType: '',
          noOfDays: '3',
          startDate: '2026-04-10',
          endDate: '2026-04-12',
          participantsCount: '145',
          facultyLead: 'Er. M. Sateesh (Coding Club Advisor)',
          remarks: 'Over 35 working web applications developed and hosted on GitHub Pages.',
          reportLink: ''
        },
        {
          title: 'Industry 4.0 & Cyber-Physical Systems in Automobile Manufacturing',
          type: 'Guest lecture',
          otherType: '',
          noOfDays: '1',
          startDate: '2026-04-16',
          endDate: '2026-04-16',
          participantsCount: '190',
          facultyLead: 'Dr. P. Suresh (Mechanical Club Mentor)',
          remarks: 'Delivered by Senior Systems Architect, Tata Motors; highly praised interactive Q&A session.',
          reportLink: ''
        },
        {
          title: 'Technical Industrial Visit to ISRO Propulsion & Space Center (SDSC SHAR)',
          type: 'Industrial visit',
          otherType: '',
          noOfDays: '2',
          startDate: '2026-04-20',
          endDate: '2026-04-21',
          participantsCount: '85',
          facultyLead: 'Er. K. Ramesh (Science & Tech Club)',
          remarks: 'Students visited vehicle assembly building and satellite telemetry center; excellent practical exposure.',
          reportLink: ''
        },
        {
          title: 'National 36-Hour Hackathon: Innovate India 2026',
          type: 'Hackathon / Project Expo',
          otherType: '',
          noOfDays: '2',
          startDate: '2026-04-25',
          endDate: '2026-04-26',
          participantsCount: '220',
          facultyLead: 'Er. C. Harika & Student Council Lead',
          remarks: '42 teams participated across AP & Karnataka; ₹50,000 cash prizes distributed to winners.',
          reportLink: ''
        }
      ]
    }
  },

  'NSS & Community Engagement': {
    hodName: 'NSS Programme Officer',
    submissionDate: '30/09/2026',
    sections: {
      journals: [],
      conferences: [],
      patents: [],
      entrepreneurship: [],
      nss: [
        {
          event: 'NSS Day Celebration',
          date: '24th Sept 2026',
          venue: 'Seminar Hall',
          type: 'NSS Day Celebration',
          participantsCount: '330 participants',
          typeOfParticipants: 'Students, NSS Volunteers and Faculty',
          outcomes: 'The NSS Day celebration created greater awareness among students about the importance of maintaining an addiction-free lifestyle. The participation in rallies, poster-making, pledge-taking, interactive sessions, and awareness performances helped students understand their role in preventing substance abuse. The programme also strengthened teamwork, leadership, communication, social responsibility, and community participation among NSS volunteers and students. Participants were encouraged to become responsible ambassadors of the "Nasha Mukt Yuva" message and spread awareness within their families, peer groups, and communities.',
          coordinator: 'Coord: Mr. M Adiseshu',
          link: ''
        }
      ],
      fdpAttended: [],
      fdpOrganized: [],
      sdp: [],
      facultyAchievements: [],
      studentAchievements: [],
      certifications: [],
      deptMeetings: [],
      mous: [],
      additionalInitiatives: [],
      techAssociation: [],
      iicCell: [],
      syllabus: []
    }
  },

  'Minutes of the Meeting': {
    hodName: 'Member Secretary - Academic Committee',
    submissionDate: '30/09/2026',
    sections: {
      journals: [],
      conferences: [],
      patents: [],
      entrepreneurship: [],
      nss: [],
      fdpAttended: [],
      fdpOrganized: [],
      sdp: [],
      facultyAchievements: [],
      studentAchievements: [],
      certifications: [],
      deptMeetings: [
        {
          title: "HoD's Meeting with Principal",
          meetingNo: 'MOM 24',
          date: '16 September 2026',
          time: '10.15 AM – 12.10 PM',
          venue: 'Principal Chamber, SSE',
          attendees: [
            { name: 'Dr. Hemachandra', designation: 'Principal - SSE' },
            { name: 'Dr. S Hari Krishnan', designation: 'Vice - Principal - SSE' },
            { name: 'Prof. Nagaraju', designation: 'HOD ECE & Dean Academics' },
            { name: 'Dr. Srinivas Rao', designation: 'HOD - EEE' },
            { name: 'Dr. Anil Kumar Reddy', designation: 'HOD - MECH' },
            { name: 'Dr. Vinod Kumar', designation: 'HOD - CSE' },
            { name: 'Dr. Sambhasivaiah', designation: 'HOD HAS' },
            { name: 'Mr. Sivaprasad', designation: 'HOD CIVIL' }
          ],
          agenda: `• ERP Portal – Leave & Class Substitution
• Assignments – Moodle Portal
• IV Year Project Review Schedule
• Research Paper & Patent Publication Targets
• Teaching & Learning Practices
• ATAL Faculty Development Programme (FDP)
• Proper Utilization of Laboratory Facilities
• Working Day – 19 September 2026`,
          discussions: [
            {
              heading: '1. ERP Portal – Leave & Class Substitution',
              details: `• All faculty members are instructed to use the ERP Portal properly for applying leave.
• Whenever a class is substituted by another faculty member, the concerned substitute faculty must accept the substitution request online through the ERP Portal.
• Leave will be considered only after the substitute faculty has accepted the substitution online.
• Faculty members applying for leave should ensure that there is no pending substitution acceptance before proceeding on leave.`,
              tableType: 'none'
            },
            {
              heading: '2. Assignment – Moodle Portal',
              details: `• All faculty members are instructed to assign assignments in the Moodle Portal.
• Faculty members should discuss the assignment questions in the respective classes before the Mid-Term Examinations.
• All three assignment questions must be discussed with the students.
• Out of the three questions discussed, one question will be given in the question paper as Assignment.`,
              tableType: 'none'
            },
            {
              heading: '3. IV Year Project Review Schedule',
              details: 'The IV Year project reviews are scheduled as follows:',
              tableType: 'project_reviews',
              reviewSchedule: [
                { review: '1st Review', date: '21 September 2026' },
                { review: '2nd Review', date: '09 October 2026' },
                { review: '3rd / Final Review', date: '23 October 2026' },
                { review: 'Final Project Report Submission', date: '24 December 2026' }
              ],
              postTableDetails: 'All concerned faculty members and students are instructed to adhere strictly to the above schedule.'
            },
            {
              heading: '4. Paper & Patent Publication Targets',
              details: 'As discussed in the HODs meeting, all HODs have agreed to and committed to achieving the following targets for research paper and patent publications:',
              tableType: 'publication_targets',
              publicationTargets: [
                { department: 'Mechanical Engineering', researchPapers: '4', patents: '0' },
                { department: 'EEE', researchPapers: '8', patents: '3' },
                { department: 'CSE', researchPapers: '20', patents: '16' },
                { department: 'Civil Engineering', researchPapers: '4', patents: '2' },
                { department: 'ECE', researchPapers: '7', patents: '4' }
              ],
              postTableDetails: 'All HODs are requested to monitor the progress regularly and ensure that the committed targets are achieved.'
            },
            {
              heading: '5. Teaching & Learning',
              details: `• All faculty members are instructed to ensure effective and proper Teaching & Learning practices.
• Faculty members should maintain quality in classroom teaching, ensure syllabus progress as per schedule, and actively engage students in the learning process.`,
              tableType: 'none'
            },
            {
              heading: '6. ATAL FDP – November 30 to December 5, 2026',
              details: `• It is happy to share that the institution has received approval for an ATAL Faculty Development Programme (FDP).
• The FDP is scheduled from 30 November to 05 December 2026 in offline mode.
• Each department is required to bring 4 participants from other institutions.
• Participation from each department is mandatory, and HODs are requested to coordinate accordingly.`,
              tableType: 'none'
            },
            {
              heading: '7. Proper Utilization of Laboratory Facilities',
              details: `• All laboratory stools and available seating facilities should be properly utilized.
• No student should be allowed to sit on the laboratory floor during practical sessions.
• Faculty members and laboratory staff are instructed to ensure proper seating arrangements and maintain discipline in the laboratories.`,
              tableType: 'none'
            },
            {
              heading: '8. Working Day – 19 September 2026',
              details: `• Saturday, 19 September 2026, will be a regular working day for all B.Tech students in view of syllabus completion.
• The Monday timetable will be followed on Saturday.
• All HODs and faculty members are requested to ensure the regular conduct of classes and maximum student attendance.`,
              tableType: 'none'
            }
          ],
          decisions: 'HoD review meeting held with Principal covering ERP leaves, Moodle assignments, IV year project reviews, paper and patent targets, ATAL FDP, lab facilities, and Saturday working day.',
          policyChanges: 'Mandatory online ERP substitution acceptance before leave approval; strict adherence to 4-stage project review timelines.',
          link: ''
        }
      ],
      mous: [],
      additionalInitiatives: [],
      techAssociation: [],
      iicCell: [],
      syllabus: []
    }
  }
};
