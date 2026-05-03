import { DocType } from '../../types';

/**
 * SALERY V17 LEGAL CLAUSE LIBRARY
 * Source: Code du Travail Marocain (B.O. n° 5210)
 */

export interface LegalClause {
  id: string;
  article: string;
  title: { fr: string; ar: string };
  content: { fr: string; ar: string };
  mandatory: boolean;
  docTypes: DocType[];
}

export const MANDATORY_CLAUSES: LegalClause[] = [
  {
    id: "CDT-試-01",
    article: "Articles 13 & 14",
    title: { fr: "Période d'essai", ar: "فترة الاختبار" },
    content: {
      fr: "La période d'essai est fixée à 3 mois pour les cadres, 1 mois et demi pour les employés et 15 jours pour les ouvriers.",
      ar: "تحدد فترة الاختبار في 3 أشهر بالنسبة للأطر، وشهر ونصف بالنسبة للمستخدمين، و 15 يوما بالنسبة للعمال."
    },
    mandatory: true,
    docTypes: [DocType.CDI, DocType.CDD]
  },
  {
    id: "CDT-休-02",
    article: "Article 231",
    title: { fr: "Congés annuels payés", ar: "العطلة السنوية المؤدى عنها" },
    content: {
      fr: "Le salarié a droit à un congé de 1,5 jour par mois de travail effectif.",
      ar: "يستحق الأجير عطلة سنوية مدتها يوم ونصف عن كل شهر من العمل الفعلي."
    },
    mandatory: true,
    docTypes: [DocType.CDI, DocType.CDD, DocType.ANAPEC]
  },
  {
    id: "CDT-保-03",
    article: "Article 3 du Dahir n° 1-59-148",
    title: { fr: "Affiliation CNSS", ar: "التسجيل في الضمان الاجتماعي" },
    content: {
      fr: "L'employeur s'engage à immatriculer le salarié à la Caisse Nationale de Sécurité Sociale (CNSS).",
      ar: "يتعهد المشغل بتسجيل الأجير في الصندوق الوطني للضمان الاجتماعي."
    },
    mandatory: true,
    docTypes: [DocType.CDI, DocType.CDD, DocType.ANAPEC, DocType.CHANTIER]
  }
];
