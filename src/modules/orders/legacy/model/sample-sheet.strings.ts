import { NRL_ID_VALUE } from '../../../shared/domain/valueObjects';

export const sampleSheetMetaStrings = {
    header: {
        title: 'Untersuchungsauftrag für Isolate/Proben',
        titleSup: 'a,b',
        subtitle:
            'Erläuterungen zum Ausfüllen dieses Formulars befinden sich im zweiten Tabellenblatt dieser Datei',
        version: 'Version V'
    },
    recipient: {
        title: 'Empfänger',
        institute: 'Bundesinstitut für Risikobewertung',
        street: 'Diedersdorfer Weg 1',
        place: 'D-12277 Berlin',
        nrl: 'Labor'
    },
    stamp: {
        receiptDate: 'Eingangsdatum beim BfR',
        customerRefNumber: 'Aktenzeichen des Einsenders'
    },
    sender: {
        title: 'Einsender',
        instituteName: 'Institut',
        department: 'Abteilung',
        street: 'Strasse',
        place: 'PLZ, Ort',
        contactPerson: 'Ansprechpartner',
        telephone: 'Telefon-Nr.',
        email: 'Email-Adresse'
    },
    signature: {
        date: 'Ort, Datum',
        dataProcessingText: 'Informationen zur Datenverarbeitung: Siehe ',
        dataProcessingLink:
            'https://www.bfr.bund.de/de/datenschutzerklaerung-107546.html',
        dataProcessingHintPre:
            'Bitte beachten Sie die allgemeinen Bedingungen für den Austausch von Materialien – Vergabe an das BfR (Material Transfer-Bedingungen – Teil B (',
        dataProcessingHintLink:
            'https://www.bfr.bund.de/cm/343/mt-bedingungen-teil-b.pdf',
        dataProcessingHintPost: ')',
        signature: 'Unterschrift'
    },
    analysis: {
        title: 'Bitte führen Sie folgende Untersuchungen der Isolate durch',
        titleSup: 'c',
        options: {
            standard: 'Standard',
            active: 'X'
        },
        species:
            'Speziesbestimmung/-differenzierung (bzw. Bestätigung der Differenzierung)',
        serological: 'Serologische Differenzierung',
        resistance: 'Resistenzermittlung',
        vaccination: 'Impfstammidentifikation',
        molecularTyping: 'Weitergehende molekularbiologische Feintypisierung',
        molecularTypingSup: 'd',
        toxin: 'Prüfung auf Toxine bzw. Virulenzeigenschaften',
        esblAmpCCarbapenemasen: 'ESBL/AmpC/Carbapenemasen',
        other: 'sonstiges (nach Absprache):',
        compareHuman: 'Vergleiche mit humanen Isolaten',
        compareHumanSup: 'e'
    },
    urgency: {
        title: 'Dringlichkeit:'
    },
    instructions: {
        sendInstructionsPre:
            'Bitte lassen Sie diesen Untersuchungsauftrag durch das MiBi-Portal (',
        sendInstructionsLink: 'https://mibi-portal.bfr.bund.de',
        sendInstructionsPost:
            ') prüfen und senden Sie die Probendaten über die dort vorhandene Senden-Funktion an das BfR.',
        printInstructions:
            'Sie erhalten die geprüften Untersuchungsaufträge vom Portal per E-Mail. Drucken Sie diese bitte aus und legen Sie diese unterschrieben den Proben als Begleitschein bei.',
        cellProtectionInstruction1:
            'Felder im Einsendebogen sind ohne Schreibschutz zur erleichterten Nutzung/Einbindung in unterschiedliche Laborinformationsmanagement-Systeme. Änderungen von Zellinhalten außerhalb der Ausfüllfelder',
        cellProtectionInstruction2:
            'sind nicht zielführend und werden beim Einlesen der Daten durch das BfR nicht berücksichtigt.'
    },
    footer: {
        validated:
            'OE-Mibi-SOP-059_FB_A01_Elektronischer Einsendebogen_V17 gültig ab 01.01.2024',
        page: 'Seite',
        pageOf: 'von'
    }
};

export const sampleSheetSamplesStrings = {
    titles: {
        sample_id: 'Ihre Probe-nummer',
        sample_id_avv: 'Probe-nummer nach AVV Data',
        partial_sample_id: 'AVV DatA-Teil-pro-ben-Nr.',
        pathogen_avv: 'Erreger',
        pathogen_text: 'Erreger',
        sampling_date: 'Datum der Probe-nahme',
        isolation_date: 'Datum der Isolierung',
        sampling_location_zip: 'Ort der Probe-nahme',
        sampling_location_text: 'Ort der Probe-nahme',
        animal_matrix_text: 'Tiere / Matrix',
        primary_production_text_avv: 'Angaben zur Primär-produktion',
        program_reason_text: 'Kontrollprogramm / Untersuchungsgrund',
        operations_mode_text: 'Betriebsart',
        vvvo: 'VVVO-Nr / Herde',
        program_text_avv: 'Programm',
        comment: 'Bemerkung'
    },
    subtitles: {
        sample_id: '',
        sample_id_avv: '',
        partial_sample_id: '',
        pathogen_avv: '(Text aus AVV DatA-Kat-Nr. 324)',
        pathogen_text: '(Text)',
        sampling_date: '',
        isolation_date: '',
        sampling_location_zip: '(PLZ)',
        sampling_location_text: '(Text)',
        animal_matrix_text: '(Text)',
        primary_production_text_avv: '(Text aus AVV DatA-Kat-Nr. 316)',
        program_reason_text: '(Text)',
        operations_mode_text: '(Text)',
        vvvo: '',
        program_text_avv: '(Text aus AVV DatA-Kat-Nr. 328)',
        comment: ''
    }
};

export const sampleSheetNRLStrings: Record<NRL_ID_VALUE, string> = {
    'NRL-AR': 'NRL für Antibiotikaresistenz',
    'NRL-AR-Kleb': 'NRL für Antibiotikaresistenz',
    'NRL-Campy': 'NRL für Campylobacter',
    'NRL-VTEC':
        'NRL für Escherichia coli einschließl. verotoxinbildende E. coli',
    'NRL-Staph':
        'NRL für koagulasepositive Staphylokokken einschl. Staphylococcus aureus',
    'NRL-Listeria': 'NRL für Listeria monocytogenes',
    'NRL-Salm': 'NRL für Salmonella',
    'KL-Vibrio': 'Konsiliarlabor für Vibrionen',
    'L-Bacillus': 'Labor für Sporenbildner, Bacillus spp.',
    'L-Clostridium': 'Labor für Sporenbildner, Clostridium spp.',
    'KL-Yersinia': 'Konsiliarlabor für Yersinia',
    'Labor nicht erkannt': ''
};
