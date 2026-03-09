/**
 * i18n 타입 정의
 *
 * 단일 책임: 지원 언어 코드와 번역 문자열 인터페이스만 정의합니다.
 * 번역 데이터는 translations.ts, 상태 관리는 locale-context.tsx 에 있습니다.
 */

export type LocaleCode =
  | "ko" | "en" | "ja" | "es" | "fr" | "de"
  | "zh-CN" | "zh-TW" | "pt" | "it" | "vi" | "th"
  | "ru" | "ar" | "hi" | "tr" | "nl" | "pl" | "sv" | "id"

export interface TranslationStrings {
  // Sidebar nav
  menu: string
  home: string
  analysis: string
  library: string
  synapse: string
  explorer: string
  featureRequest: string
  subscribe: string
  settings: string
  // GNB
  gnbTitle: string
  // Language modal
  langModalTranslation: string
  langModalTranslationDesc: string
  langModalRecommended: string
  langModalChoose: string
  // Analysis page
  analysisTitle: string
  analysisDesc: string
  analysisPlaceholder: string
  analysisButton: string
  analysisLoading: string
  analysisPlatform: string
  analysisSaved: string
  analysisSaveToLibrary: string
  analysisAnalyzing: string
  // Landing page
  landingBetaBadge: string
  landingHero1: string
  landingHero2: string
  landingSubtitle1: string
  landingSubtitle2: string
  landingCta: string
  landingLibrary: string
  landingHowTitle: string
  landingHowDesc: string
  landingStep1Title: string
  landingStep1Desc: string
  landingStep2Title: string
  landingStep2Desc: string
  landingStep3Title: string
  landingStep3Desc: string
  landingFeaturesTitle: string
  landingFeaturesDesc: string
  landingFeature1Title: string
  landingFeature1Desc: string
  landingFeature2Title: string
  landingFeature2Desc: string
  landingFeature3Title: string
  landingFeature3Desc: string
  landingFeature4Title: string
  landingFeature4Desc: string
  landingPricingTitle: string
  landingPricingDesc: string
  landingFooter: string
  landingNavStart: string
  landingNavTrial: string
  // Library page
  libraryTitle: string
  libraryDesc: string
  // Explorer page
  explorerTitle: string
  explorerDesc: string
  explorerEmptyTitle: string
  explorerEmptyDesc: string
  explorerExploreBtn: string
  explorerRecommended: string
  explorerCount: string
  explorerRefresh: string
  explorerViewVideo: string
  // Synapse page
  synapseTitle: string
  synapseDesc: string
  synapseNeedContent: string
  synapseNeedContentDesc: string
  synapseSelectCard: string
  synapseEmptySlot: string
  synapsePickFromLibrary: string
  synapseLibraryEmpty: string
  synapseChangeCard: string
  // Creation Card
  creationExport: string
  creationPlaceholder: string
  creationStep1Title: string
  creationStep1Desc: string
  creationStep2Title: string
  creationStep2Desc: string
  creationStep3Title: string
  creationStep3Desc: string
  creationStep4Title: string
  creationStep4Desc: string
  creationStep5Title: string
  creationStep5Desc: string
  creationStep6Title: string
  creationStep6Desc: string
  creationStep7Title: string
  creationStep7Desc: string
  creationStep8Title: string
  creationStep8Desc: string
  creationStep9Title: string
  creationStep9Desc: string
  creationDropHint: string
  creationSave: string
  creationLoad: string
  creationSaveSuccess: string
  creationLoadSuccess: string
  creationLoadEmpty: string
  // Feature Request page
  featureRequestTitle: string
  featureRequestDesc: string
  featureRequestNewTitle: string
  featureRequestFormTitle: string
  featureRequestFormTitlePlaceholder: string
  featureRequestFormDesc: string
  featureRequestFormDescPlaceholder: string
  featureRequestFormCategory: string
  featureRequestFormCategoryPlaceholder: string
  featureRequestFormPriority: string
  featureRequestPriorityLow: string
  featureRequestPriorityMedium: string
  featureRequestPriorityHigh: string
  featureRequestSubmit: string
  featureRequestListTitle: string
  featureRequestCategoryAI: string
  featureRequestCategoryAnalysis: string
  featureRequestCategoryCollab: string
  featureRequestCategoryUtility: string
  featureRequestCategoryUIUX: string
  featureRequestCategoryOther: string
  // Subscribe page
  subscribeTitle: string
  subscribeDesc: string
  subscribeRecommended: string
  subscribeFree: string
  subscribeFreeBtn: string
  subscribeBtn: string
  subscribeMonth: string
  subscribeBackToPlans: string
  subscribePaymentInfo: string
  subscribeCardName: string
  subscribeCardNumber: string
  subscribeExpiry: string
  subscribeCVC: string
  subscribeReferralCode: string
  subscribeReferralPlaceholder: string
  subscribeReferralDesc: string
  subscribeProcessing: string
  subscribePayBtn: string
  subscribeStartFree: string
  // Pricing plan names/descriptions
  planStarterName: string
  planCreatorName: string
  planProName: string
  planStarterDesc: string
  planCreatorDesc: string
  planProDesc: string
  planStarterCta: string
  planCreatorCta: string
  planProCta: string
  // Pricing features
  planFeatureAnalysis3: string
  planFeatureDNA9: string
  planFeatureLibrary10: string
  planFeatureSynapse: string
  planFeatureAnalysis30: string
  planFeatureDNAAI: string
  planFeatureLibrary1y: string
  planFeatureSynapseAI: string
  planFeatureTrendWeekly: string
  planFeatureExport: string
  planFeatureAnalysis200: string
  planFeatureDNAMultiAI: string
  planFeatureLibrary2y: string
  planFeatureSynapseUnlimited: string
  planFeatureTrendRealtime: string
  planFeatureTeam5: string
  planFeatureAPI: string
  planFeaturePrioritySupport: string
  // Settings page
  settingsTitle: string
  settingsDesc: string
  settingsProfile: string
  settingsName: string
  settingsEmail: string
  settingsSave: string
  settingsCurrentPlan: string
  settingsCurrentPlanDesc: string
  settingsChangePlan: string
  settingsReferralProgram: string
  settingsReferralDescLocked: string
  settingsReferralDescActive: string
  settingsModalTestDev: string
  settingsActivated: string
  settingsLocked: string
  settingsCongratsAmbassador: string
  settingsAnalysisHint: string
  settingsUnlockBtn: string
  settingsMoreAnalysis: string
  settingsMyCode: string
  settingsTotalSignups: string
  settingsTodayNew: string
  settingsAccumulatedReward: string
  settingsSettledReward: string
  settingsSettlementAmount: string
  settingsRequestSettlement: string
  settingsTierStatus: string
  settingsFriendDiscount: string
  settingsReferrerReward: string
  settingsSubscriberStatus: string
  settingsTableId: string
  settingsTableJoinDate: string
  settingsTableStatus: string
  settingsTableReward: string
  settingsStatusActive: string
  settingsStatusCancelled: string
  settingsMonthlyAnalysis: string
  settingsMonthlyAnalysisDesc: string
  settingsUsage: string
  settingsRemainingAnalysis: string
  settingsUsed: string
  settingsMonthlyReset: string
  settingsWelcomeTitle: string
  settingsWelcomeDesc: string
  settingsWelcomeHighlight: string
  settingsAgreeTerms: string
  settingsStartBtn: string
  // Explorer analysis section labels
  explorerContentType: string
  explorerHook: string
  explorerScriptAppeal: string
  explorerCaptionAnalysis: string
  explorerDirection: string
  explorerEngagement: string
  explorerSalesPoints: string
  explorerDifficulty: string
}
