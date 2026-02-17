import { useState } from "react";

// ─── Context Panels ─────────────────────────────────────────────────────────
const CONTEXT = {
  cloud_middleware: {
    title: "How Cloud Integration Works",
    description: "Mercury and UCI are middleware applications that physically sit on the Android payment terminal. They run in the background and intercept cloud-based messages from the merchant's back-end system (EPOS, ERP, CRM). The middleware translates that message and passes it via an app-to-app call to the payment application on the device. The payment application handles all processing and security, then sends the response back through the middleware to the POS.",
    flow: ["ECR / POS", "→", "Cloud", "→", "Middleware\n(Mercury or UCI)", "→", "Payment App\n(POSitive / eService)", "→", "Acquiring Host"],
    detail: null,
  },
  mercury_detail: {
    title: "Mercury — Cloud Middleware",
    subtitle: "Built & managed internally by Global Payments",
    description: "Mercury is a cloud-based REST API integration layer. It sits on the PAX terminal as a background application and intercepts internet-based messages from the merchant's cloud system. It translates and forwards them to the payment application via an on-device app-to-app call. Mercury works with both PAX POSitive (→ Greenhouse) and eService (→ Postillion), but both routes are UK-only today.",
    flow: ["ECR / Cloud POS", "→", "Internet", "→", "Mercury\n(on terminal)", "→", "PAX POSitive\nor eService", "→", "Greenhouse\nor Postillion"],
    detail: "Mercury is the go-to for UK cloud integrations, especially where the merchant needs Greenhouse-level reporting. If the ISV or merchant needs Ireland coverage, Mercury can't support it yet — that's where UCI comes in.",
  },
  uci_detail: {
    title: "UCI — Cloud Middleware",
    subtitle: "Built & managed by Global Payments / EVO",
    description: "UCI works the same way as Mercury — it's a cloud-based REST API middleware app sitting on the terminal. The key difference: UCI is certified to the eService payment application in both the UK and Ireland, giving it cross-border coverage. However, UCI does not support routing to Greenhouse (GSAP-EU), so enterprise merchants on the Greenhouse stack can't use it without re-boarding.",
    flow: ["ECR / Cloud POS", "→", "Internet", "→", "UCI\n(on terminal)", "→", "eService", "→", "eService\n(Postillion)"],
    detail: "UCI is the play for ISVs who need a single integration covering UK and Ireland. The trade-off is eService-only routing (BRC reporting, no My Account). UCI is currently in pilot — confirm availability with product before committing.",
  },
  local_network: {
    title: "How Local Network Integration Works",
    description: "Traditional semi-integrated solutions connect the terminal and POS over the same local network (Wi-Fi or Ethernet). The POS sends transaction messages directly to the terminal over the LAN — no cloud routing involved. This is how Ingenico managed service terminals have worked for years. PAX POSitive Weblink and eService Local API follow the same pattern but on modern Android devices.",
    flow: ["ECR / POS", "→", "Local Network\n(Wi-Fi / Ethernet)", "→", "Payment App\non Terminal", "→", "Acquiring Host"],
    detail: null,
  },
  app2app_explain: {
    title: "How App-to-App Integration Works",
    description: "With App2App, there's no separate EPOS hardware at all. Two applications run on the same physical terminal — a 3rd-party POS app and the payment application. They communicate locally on the device via Android IPC (Intent) mechanisms. This is ideal when the ISV wants their entire checkout experience running on a single PAX device.",
    flow: ["3rd-Party POS App\n(on terminal)", "→", "Android IPC\n(Intent)", "→", "Payment App\n(on same device)", "→", "Acquiring Host"],
    detail: null,
  },
  hosting_stacks: {
    title: "Greenhouse vs eService — The Hosting Decision",
    subtitle: "One of the most important distinctions in GP's in-person world",
    description: "Enterprise merchants typically board to the Greenhouse (GSAP-EU) stack — it has My Account for reporting, API-based data access, and more mature tooling. SMB merchants and ISV-led deals typically board to eService (Postillion) — it uses BRC (Business Resource Centre) for reporting, which is functional but less capable than My Account.",
    flow: null,
    detail: "If a merchant is already on Greenhouse and you recommend a UCI/eService-only solution, they'd need to re-board and lose My Account access. Always check the existing stack first.",
  },
  isv_commercial: {
    title: "ISV-Led vs Merchant-Led — The Commercial Reality",
    subtitle: "A real-world example from the field",
    description: "For cloud-based integrations, GP needs to see a broader partnership opportunity — not just a single merchant. The Partner Acquisition team manages the ISV relationship and assesses the pipeline. CSMs manage the merchant side but can't own the ISV partnership. Technical conversations should not happen until the commercial relationship is agreed.",
    flow: null,
    detail: "Example: a heritage/tourism merchant wanted a kiosk integration with a photo printing ISV. Before any technical work, the Partner Acquisition team needed to assess what other opportunities the ISV could bring beyond just that single merchant.",
  },
  geography_context: {
    title: "Why Geography Is the First Filter",
    subtitle: "UK vs Ireland support varies significantly across stacks",
    description: "Mercury (cloud middleware) and PAX POSitive (payment app) are only certified for the UK today. If Ireland is in scope, the only cloud-based option is UCI + eService, which covers both UK and Ireland. Mercury → eService certification for Ireland is on the roadmap but not yet complete. This has been a real issue on deals where Ireland coverage was needed late in discovery — the entire solution stack had to be pivoted.",
    flow: null,
    detail: "Always establish geography early. If you're halfway through a technical conversation before realising Ireland is needed, you may have to pivot the entire solution stack.",
  },
  terminal_context: {
    title: "Terminal Form Factors — Matching Hardware to Use Case",
    subtitle: "The A920 Pro is a jack of all trades, master of none",
    description: "The PAX A920 Pro suits mobile and pay-at-table scenarios well but isn't ideal as a fixed lane device — it's not built for that spec. For multi-lane retail, the PAX A35 (PIN pad) or Ingenico Lane 3000/3600 are better fits. For unattended environments like kiosks, vending machines, and EV charging, the PAX IM30 or Nexgo UN20 are purpose-built with ruggedised designs. The eService stack supports more terminal variety (A920 Pro, A35, A77, IM30 + Ingenico devices), while PAX POSitive currently only supports the A920 Pro.",
    flow: null,
    detail: "Terminal choice also affects which payment app and integration stack is available. If the merchant needs a specific form factor like a PIN pad (A35) or unattended (IM30), this narrows the solution to the eService stack.",
  },
  reporting_context: {
    title: "Reporting — My Account vs BRC",
    subtitle: "A common deal-breaker for enterprise merchants",
    description: "Greenhouse merchants get My Account — a mature reporting portal with API-based data access, transaction reconciliation, dispute management, and analytics. It allows benchmarking against competitors and provides comprehensive data exports. eService merchants get BRC (Business Resource Centre) — it's functional for basic reporting needs but lacks the depth, API access, and polish that enterprise merchants typically expect.",
    flow: null,
    detail: "This matters most during discovery. If a merchant has sophisticated finance or ops teams that rely on detailed reporting for reconciliation, pushing them to an eService/BRC solution could become a blocker. My Account on Greenhouse is significantly more mature.",
  },
  p2pe_context: {
    title: "P2PE — Point-to-Point Encryption",
    subtitle: "Reducing PCI DSS scope for large estates",
    description: "P2PE encrypts card data from the moment it touches the terminal device, keeping it encrypted until it reaches GP's acquiring host. This massively reduces the merchant's annual PCI DSS assessment scope and simplifies compliance. It's aimed at large enterprise customers across retail, universities, hospitality, and automotive verticals. P2PE as an industry standard is expected to grow 15% year on year, moving from enterprise into the mid-market.",
    flow: ["Card Tap / Insert", "→", "Encrypted at\nTerminal", "→", "Encrypted\nin Transit", "→", "Decrypted at\nGP Host"],
    detail: "P2PE is currently available on the Ingenico managed service stack. It's already deployed across well-known enterprise merchants in retail, hospitality, and restaurant verticals.",
  },
  existing_stack_context: {
    title: "Why the Existing Stack Matters",
    subtitle: "Avoid accidental re-boarding",
    description: "If a merchant is already processing with GP on the Greenhouse (GSAP-EU) stack and you recommend a UCI/eService-only solution, they would need to be re-boarded to eService — losing access to My Account reporting and potentially disrupting existing payment flows. Conversely, if they're already on eService, swapping from Ingenico hardware to PAX is seamless with no redevelopment needed on the eService API integration.",
    flow: null,
    detail: "This is one of the most common gotchas in solution design. A merchant CSM might not know which host the merchant is on — it's worth checking Salesforce or asking the acquiring team before locking in a recommendation.",
  },
  timeline_context: {
    title: "Why Timeline Affects the Recommendation",
    subtitle: "Not all solutions are equally ready to deploy",
    description: "The Ingenico managed service is the most mature and readily deployable stack — terminals can be set up, customised, and dispatched quickly. Mercury on PAX is also production-ready for UK cloud integrations. However, UCI is still in pilot, so for urgent deals it may not be available or fully supported. Mercury's certification to eService in Ireland is also still in progress, so deals requiring Ireland cloud coverage on a tight timeline need careful expectation management.",
    flow: null,
    detail: "For urgent requirements, lean towards proven stacks. For longer-term deals, roadmap items like UCI general availability or Mercury Ireland certification become viable options worth positioning.",
  },
};

// ─── Solution-Specific Architecture Flows ───────────────────────────────────
const SOLUTION_FLOWS = {
  ingenico_managed: {
    title: "Solution Architecture",
    layers: [
      { label: "POS LAYER", node: "Merchant POS\n(ECR / EPOS)", color: "#4f8ff7" },
      { label: "NETWORK", node: "Local Network\nWi-Fi / Ethernet", color: "#8b949e" },
      { label: "TERMINAL", node: "Ingenico\nDesk / Move / Lane\n5000 / 3000", color: "#34d399" },
      { label: "ACQUIRING HOST", node: "Greenhouse\n(GSAP-EU)", color: "#a78bfa" },
      { label: "REPORTING", node: "My Account", color: "#fbbf24" },
    ],
    note: "Direct local network connection — no cloud middleware involved. Payment processing and security handled entirely by the Ingenico terminal application.",
  },
  pax_mercury: {
    title: "Solution Architecture",
    layers: [
      { label: "POS LAYER", node: "ISV / Cloud POS\nERP / CRM / EPOS", color: "#4f8ff7" },
      { label: "NETWORK", node: "Internet\n(Cloud REST API)", color: "#8b949e" },
      { label: "MIDDLEWARE", node: "Mercury\n(on PAX A920 Pro)", color: "#f97316" },
      { label: "PAYMENT APP", node: "PAX POSitive\nor eService", color: "#34d399" },
      { label: "HOST", node: "Greenhouse\nor Postillion", color: "#a78bfa" },
      { label: "REPORTING", node: "My Account\nor BRC", color: "#fbbf24" },
    ],
    note: "Mercury sits on the terminal as background middleware. It intercepts cloud messages, translates them, and passes them to the payment app via an on-device app-to-app call. UK only today.",
  },
  pax_weblink: {
    title: "Solution Architecture",
    layers: [
      { label: "POS LAYER", node: "Merchant POS\n(ECR / EPOS)", color: "#4f8ff7" },
      { label: "NETWORK", node: "Local Network\nIP-based (Static IP)", color: "#8b949e" },
      { label: "TERMINAL", node: "POSitive Weblink\n(PAX A920 Pro)", color: "#f97316" },
      { label: "PAYMENT APP", node: "PAX POSitive", color: "#34d399" },
      { label: "ACQUIRING HOST", node: "Greenhouse\n(GSAP-EU)", color: "#a78bfa" },
      { label: "REPORTING", node: "My Account", color: "#fbbf24" },
    ],
    note: "POSitive Weblink provides a local REST API on the terminal. POS communicates directly over the LAN — no cloud routing, lower latency. Requires static IP and robust local networking.",
  },
  pax_app2app: {
    title: "Solution Architecture",
    layers: [
      { label: "POS APP", node: "3rd-Party\nAndroid POS App", color: "#4f8ff7" },
      { label: "ON-DEVICE", node: "Android IPC\n(Intent)", color: "#8b949e" },
      { label: "PAYMENT APP", node: "PAX POSitive\n(same A920 Pro)", color: "#34d399" },
      { label: "ACQUIRING HOST", node: "Greenhouse\n(GSAP-EU)", color: "#a78bfa" },
      { label: "REPORTING", node: "My Account", color: "#fbbf24" },
    ],
    note: "Both apps run on the same physical PAX A920 Pro device. No separate EPOS hardware, no network dependency. Communication via Android IPC mechanisms.",
  },
  evo_uci: {
    title: "Solution Architecture",
    layers: [
      { label: "POS LAYER", node: "ISV / Cloud POS\nERP / CRM / EPOS", color: "#4f8ff7" },
      { label: "NETWORK", node: "Internet\n(Cloud REST API)", color: "#8b949e" },
      { label: "MIDDLEWARE", node: "UCI\n(on terminal)", color: "#f97316" },
      { label: "PAYMENT APP", node: "eService\n(UK & Ireland)", color: "#34d399" },
      { label: "ACQUIRING HOST", node: "eService\n(Postillion)", color: "#a78bfa" },
      { label: "REPORTING", node: "BRC", color: "#fbbf24" },
    ],
    note: "UCI sits on the terminal as background middleware — same pattern as Mercury. The key difference: UCI is certified for eService in both UK and Ireland but cannot route to Greenhouse.",
  },
  evo_local_api: {
    title: "Solution Architecture",
    layers: [
      { label: "POS LAYER", node: "Merchant POS\n(ECR / EPOS)", color: "#4f8ff7" },
      { label: "NETWORK", node: "Local Network\nETH / BT / WiFi", color: "#8b949e" },
      { label: "TERMINAL", node: "eService API\n(on terminal)", color: "#f97316" },
      { label: "PAYMENT APP", node: "eService\n(UK & Ireland)", color: "#34d399" },
      { label: "ACQUIRING HOST", node: "eService\n(Postillion)", color: "#a78bfa" },
      { label: "REPORTING", node: "BRC", color: "#fbbf24" },
    ],
    note: "Local REST API integration over the merchant's network. Works on both PAX and Ingenico devices — allows easy swap from Ingenico to PAX without ISV redevelopment.",
  },
  evo_intents: {
    title: "Solution Architecture",
    layers: [
      { label: "POS APP", node: "3rd-Party\nAndroid POS App", color: "#4f8ff7" },
      { label: "ON-DEVICE", node: "Android IPC\n(Intent)", color: "#8b949e" },
      { label: "PAYMENT APP", node: "eService\n(same PAX device)", color: "#34d399" },
      { label: "ACQUIRING HOST", node: "eService\n(Postillion)", color: "#a78bfa" },
      { label: "REPORTING", node: "BRC", color: "#fbbf24" },
    ],
    note: "Both apps run on the same PAX device. No separate EPOS hardware needed. Works across A920 Pro, A35, A77, and IM30 in UK and Ireland.",
  },
  gp_tom: {
    title: "Solution Architecture",
    layers: [
      { label: "DEVICE", node: "Merchant's\nSmartphone", color: "#4f8ff7" },
      { label: "APPLICATION", node: "GP TOM App", color: "#f97316" },
      { label: "ACCEPTANCE", node: "Contactless\nNFC Tap", color: "#34d399" },
      { label: "ACQUIRING HOST", node: "GP\nAcquiring", color: "#a78bfa" },
    ],
    note: "Smartphone becomes the payment terminal. No dedicated hardware needed. Ideal for mobile businesses, queue busting, or outage backup.",
  },
  self_service_kiosk: {
    title: "Solution Architecture",
    layers: [
      { label: "CUSTOMER", node: "Customer\nSelf-Service", color: "#4f8ff7" },
      { label: "KIOSK", node: "Kiosk Application\n(ISV Software)", color: "#f97316" },
      { label: "PAYMENT", node: "Unattended Terminal\nIM30 / UN20", color: "#34d399" },
      { label: "ACQUIRING HOST", node: "eService or\nGreenhouse", color: "#a78bfa" },
    ],
    note: "Purpose-built for unattended environments. Terminal hardware is ruggedised for high footfall and harsh conditions. Integration typically via UCI, eService API, or App2App depending on stack.",
  },
};

// ─── Solution Database ──────────────────────────────────────────────────────
const SOLUTIONS = {
  ingenico_managed: {
    id: "ingenico_managed", name: "Ingenico Managed Service",
    category: "Standalone / Semi-Integrated", host: "Greenhouse (GSAP-EU)",
    geography: ["UK"], merchantSize: ["SMB", "Enterprise"],
    integration: "Semi-integrated (local network)",
    terminals: ["Ingenico Desk 5000", "Ingenico Move 5000", "Ingenico Lane 3000"],
    features: ["Set-up & customisation", "1st/2nd/3rd line helpdesk", "Fault replacements", "PCI hardware replacements", "Estate reporting", "P2PE available"],
    reporting: "My Account (Greenhouse)", architectureKey: "local_network",
    ideal: "Merchants wanting a fully managed terminal estate with Ingenico hardware, on-premise semi-integrated POS integration over local network. Strong enterprise reporting via My Account.",
    considerations: ["Legacy Linux terminals being replaced by modern Android devices", "Local network integration only — no cloud-based option", "UK only"],
    p2pe: true,
  },
  pax_mercury: {
    id: "pax_mercury", name: "PAX + Mercury (Cloud)",
    category: "Cloud-Based Integration", host: "Greenhouse (GSAP-EU) via PAX POSitive / eService — UK only",
    geography: ["UK"], merchantSize: ["SMB", "Enterprise"],
    integration: "Cloud-based REST API", terminals: ["PAX A920 Pro"],
    features: ["Sale", "Credit", "Refund", "Reversal/Void", "Pre-auth", "Completion", "Deletion", "Cashback", "Gratuity", "EOD"],
    reporting: "My Account (Greenhouse) or BRC (eService)", architectureKey: "mercury_detail",
    ideal: "ISVs and merchants needing cloud-based integration (ERPs, CRMs, browser-based EPOS). UK-only deals where the ISV wants flexibility between Greenhouse and eService stacks.",
    considerations: ["UK only — no Ireland support yet", "Potential network latency (cloud routing)", "PAX A920 Pro only", "Mercury → eService certified UK only"],
    p2pe: false,
  },
  pax_weblink: {
    id: "pax_weblink", name: "PAX + POSitive Weblink (Local)",
    category: "Local Network Integration", host: "Greenhouse (GSAP-EU) via PAX POSitive",
    geography: ["UK"], merchantSize: ["SMB", "Enterprise"],
    integration: "IP-based local network REST API", terminals: ["PAX A920 Pro"],
    features: ["Sale", "Credit", "Refund", "Reversal/Void", "Pre-auth", "Completion", "Deletion", "Cashback", "Gratuity", "EOD"],
    reporting: "My Account (Greenhouse)", architectureKey: "local_network",
    ideal: "Local network scenarios like Pay@Counter, Pay@Table, and kiosks where low latency is critical and robust local networking exists.",
    considerations: ["Requires robust local network", "Static IP address needed", "UK only", "PAX A920 Pro only"],
    p2pe: false,
  },
  pax_app2app: {
    id: "pax_app2app", name: "PAX + POSitive App2App",
    category: "On-Device Integration", host: "Greenhouse (GSAP-EU) via PAX POSitive",
    geography: ["UK"], merchantSize: ["SMB"],
    integration: "SDK / Intent-based (Android IPC)", terminals: ["PAX A920 Pro"],
    features: ["Sale", "Credit", "Refund", "Reversal/Void", "Pre-auth", "Completion", "Deletion", "Cashback", "Gratuity", "EOD"],
    reporting: "My Account (Greenhouse)", architectureKey: "app2app_explain",
    ideal: "3rd-party Android POS apps running directly on a PAX A920 Pro terminal. No separate EPOS hardware needed.",
    considerations: ["Communication local to device only", "PAX A920 Pro only", "UK only"],
    p2pe: false,
  },
  evo_uci: {
    id: "evo_uci", name: "EVO/eService + UCI (Cloud)",
    category: "Cloud-Based Integration", host: "eService (Postillion)",
    geography: ["UK", "Ireland"], merchantSize: ["SMB", "ISV-led"],
    integration: "Cloud-based REST API",
    terminals: ["PAX A920 Pro", "PAX A35", "PAX A77", "PAX IM30", "Ingenico Desk 5000", "Ingenico Move 5000", "Ingenico Lane 3600"],
    features: ["Sale", "MOTO", "Credit", "Refund", "Reversal/Void", "Pre-auth", "Pre-Auth Increment", "Pre-Auth Cancel", "Completion", "Cashback", "Gratuity", "DCC", "Pay@Table", "EOD"],
    reporting: "BRC (Business Resource Centre)", architectureKey: "uci_detail",
    ideal: "ISVs needing cloud integration across UK AND Ireland. Consistent eService stack across both markets. Multi-region ISV partnerships.",
    considerations: ["No Greenhouse/GSAP support — enterprise merchants can't use UCI without re-boarding", "BRC reporting less mature than My Account", "UCI currently in pilot", "Deletion not supported"],
    p2pe: false,
  },
  evo_local_api: {
    id: "evo_local_api", name: "EVO/eService + Local API",
    category: "Local Network Integration", host: "eService (Postillion)",
    geography: ["UK", "Ireland"], merchantSize: ["SMB"],
    integration: "ETH, BT, WiFi (local network) REST API",
    terminals: ["PAX A920 Pro", "PAX A35", "PAX A77", "PAX IM30", "Ingenico Desk 5000", "Ingenico Move 5000", "Ingenico Lane 3600"],
    features: ["Sale", "MOTO", "Credit", "Refund", "Reversal/Void", "Pre-auth", "Pre-Auth Increment", "Pre-Auth Cancel", "Completion", "Deletion", "Cashback", "Gratuity", "DCC", "Pay@Table", "EOD"],
    reporting: "BRC (Business Resource Centre)", architectureKey: "local_network",
    ideal: "Local network Pay@Counter, Pay@Table, kiosk scenarios in UK & Ireland. Easy swap from Ingenico to PAX without redevelopment.",
    considerations: ["Requires robust local network", "BRC reporting", "eService stack only"],
    p2pe: false,
  },
  evo_intents: {
    id: "evo_intents", name: "EVO/eService + Intents App2App",
    category: "On-Device Integration", host: "eService (Postillion)",
    geography: ["UK", "Ireland"], merchantSize: ["SMB"],
    integration: "SDK / Intent-based (Android IPC)",
    terminals: ["PAX A920 Pro", "PAX A35", "PAX A77", "PAX IM30"],
    features: ["Sale", "MOTO", "Credit", "Refund", "Reversal/Void", "Pre-auth", "Completion", "Deletion", "Cashback", "Gratuity", "DCC", "EOD"],
    reporting: "BRC (Business Resource Centre)", architectureKey: "app2app_explain",
    ideal: "3rd-party Android POS apps on PAX devices in UK or Ireland. No separate EPOS hardware needed.",
    considerations: ["PAX devices only", "BRC reporting"],
    p2pe: false,
  },
  gp_tom: {
    id: "gp_tom", name: "GP TOM (Terminal on Mobile)",
    category: "Mobile / SoftPOS", host: "Various",
    geography: ["UK", "Ireland"], merchantSize: ["SMB", "Mobile"],
    integration: "Smartphone app", terminals: ["Any compatible smartphone"],
    features: ["Contactless payments", "Mobile checkout"],
    reporting: "Standard", architectureKey: null,
    ideal: "Always-mobile businesses, queue busting, outage backup. Transforms a smartphone into a POS terminal for contactless payments.",
    considerations: ["Contactless only", "Limited to smartphone capabilities"],
    p2pe: false,
  },
  self_service_kiosk: {
    id: "self_service_kiosk", name: "Self-Service Kiosks",
    category: "Unattended", host: "Various",
    geography: ["UK", "Ireland"], merchantSize: ["Enterprise", "SMB"],
    integration: "Varies (typically semi-integrated)",
    terminals: ["PAX IM30", "Nexgo UN20", "Custom kiosk builds"],
    features: ["Unattended payments", "High footfall handling", "Customer self-service"],
    reporting: "Depends on stack", architectureKey: null,
    ideal: "High footfall environments needing customer self-service. Alternative to traditional EPOS for retail, hospitality, quick-service.",
    considerations: ["Requires robust hardware for durability", "Unattended terminal certification needed"],
    p2pe: false,
  },
};

// ─── Questions ──────────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    id: "geography",
    question: "Where does the merchant need to accept in-person payments?",
    why: "First major filter. Mercury and PAX POSitive stacks are UK-only today. UCI + eService covers both UK and Ireland. If Ireland is in scope, it eliminates several options immediately.",
    options: [
      { label: "UK only", value: "uk" },
      { label: "Ireland only", value: "ireland" },
      { label: "Both UK and Ireland", value: "uk_ireland" },
      { label: "Other European markets", value: "europe" },
    ],
    contextKey: "geography_context",
    dynamicContext: null,
  },
  {
    id: "merchant_size",
    question: "How would you classify this merchant?",
    why: "Enterprise merchants typically board to the Greenhouse stack — better reporting via My Account with API access. SMB merchants typically board to eService. This affects which hosts and integration layers are appropriate.",
    options: [
      { label: "Enterprise — large estate, complex requirements, advanced reporting", value: "enterprise" },
      { label: "Mid-market — growing business, some complexity", value: "mid_market" },
      { label: "SMB — straightforward needs, smaller estate", value: "smb" },
    ],
    contextKey: "hosting_stacks",
    dynamicContext: null,
  },
  {
    id: "isv_led",
    question: "Is this opportunity ISV-led or merchant-led?",
    why: "Critical commercial question. ISV-led deals go through Partner Acquisition — the ISV must bring opportunities beyond just this one merchant. Merchant-led cloud integrations are rarely entertained unless the ISV has a broader pipeline.",
    options: [
      { label: "ISV-led — a software partner is driving the integration", value: "isv" },
      { label: "Merchant-led — the merchant is requesting the solution", value: "merchant" },
      { label: "Not sure yet — still in discovery", value: "unknown" },
    ],
    contextKey: "isv_commercial",
    dynamicContext: null,
  },
  {
    id: "integration_type",
    question: "What type of integration does the merchant or ISV need?",
    why: "Determines the middleware layer and architecture. Cloud-based uses Mercury or UCI as middleware on the terminal. Local network connects POS to terminal over LAN. App2App runs both apps on the same device. Standalone needs no integration.",
    options: [
      { label: "Cloud-based — connecting to a cloud EPOS, ERP, or CRM", value: "cloud" },
      { label: "Local network — on-premise POS (Pay@Counter, Pay@Table)", value: "local" },
      { label: "App2App — 3rd party Android app on the terminal itself", value: "app2app" },
      { label: "Standalone — no integration, just a terminal", value: "standalone" },
      { label: "Not sure — need to explore", value: "unknown" },
    ],
    contextKey: null,
    dynamicContext: { cloud: "cloud_middleware", local: "local_network", app2app: "app2app_explain" },
  },
  {
    id: "terminal_form",
    question: "What terminal form factor best suits their environment?",
    why: "Different use cases need different hardware. The A920 Pro suits mobile scenarios but isn't ideal as a fixed lane device. Terminal choice also narrows which payment app and stack is available.",
    options: [
      { label: "Countertop / Desktop — fixed checkout position", value: "countertop" },
      { label: "Mobile / Portable — table service, on-the-go", value: "mobile" },
      { label: "Retail PIN Pad — multi-lane checkout", value: "pinpad" },
      { label: "Unattended — kiosks, vending, EV charging", value: "unattended" },
      { label: "Mix of form factors across locations", value: "mixed" },
    ],
    contextKey: "terminal_context",
    dynamicContext: null,
  },
  {
    id: "reporting",
    question: "How important is advanced reporting and analytics?",
    why: "Greenhouse offers My Account — mature platform with API access, dispute management, and analytics. eService uses BRC which is more limited. Enterprise merchants with reconciliation needs typically prefer Greenhouse.",
    options: [
      { label: "Critical — advanced reporting, API access, dispute management", value: "critical" },
      { label: "Important but not a dealbreaker", value: "important" },
      { label: "Basic reporting is fine", value: "basic" },
    ],
    contextKey: "reporting_context",
    dynamicContext: null,
  },
  {
    id: "p2pe",
    question: "Does the merchant require Point-to-Point Encryption (P2PE)?",
    why: "P2PE encrypts card data from the moment it touches the terminal until it reaches GP's host. Reduces PCI DSS scope significantly. Available on Ingenico managed service. Common requirement in retail, universities, hospitality, and automotive.",
    options: [
      { label: "Yes — P2PE is a requirement", value: "yes" },
      { label: "Nice to have but not essential", value: "nice" },
      { label: "No — not required", value: "no" },
    ],
    contextKey: "p2pe_context",
    dynamicContext: null,
  },
  {
    id: "existing_stack",
    question: "Is the merchant already processing with Global Payments?",
    why: "If they're on Greenhouse today, recommending an eService-only solution (UCI) means re-boarding and losing My Account. If they're on eService, swapping Ingenico to PAX hardware is seamless with no redevelopment.",
    options: [
      { label: "Yes — currently on Greenhouse / GSAP", value: "greenhouse" },
      { label: "Yes — currently on eService / Postillion", value: "eservice" },
      { label: "New to Global Payments", value: "new" },
      { label: "Not sure", value: "unknown" },
    ],
    contextKey: "existing_stack_context",
    dynamicContext: null,
  },
  {
    id: "timeline",
    question: "What's the expected timeline for go-live?",
    why: "Not all solutions are equally ready to deploy. UCI is still in pilot and Mercury's Ireland certification isn't complete. For urgent deals, you need to lean towards proven, production-ready stacks.",
    options: [
      { label: "Urgent — within 1-2 months", value: "urgent" },
      { label: "Standard — 3-6 months", value: "standard" },
      { label: "Long-term — 6+ months, happy to wait for roadmap items", value: "long_term" },
    ],
    contextKey: "timeline_context",
    dynamicContext: null,
  },
];

// ─── Recommendation Engine ──────────────────────────────────────────────────
function generateRecommendation(answers) {
  const sc = {};
  Object.keys(SOLUTIONS).forEach((k) => (sc[k] = 0));
  const { geography: geo, merchant_size: size, isv_led: isv, integration_type: integ, terminal_form: form, reporting: report, p2pe, existing_stack: stack, timeline } = answers;

  if (geo === "ireland" || geo === "uk_ireland") {
    sc.ingenico_managed = sc.pax_mercury = sc.pax_weblink = sc.pax_app2app = -100;
    sc.evo_uci += 15; sc.evo_local_api += 10; sc.evo_intents += 10;
  }
  if (geo === "uk") { sc.pax_mercury += 5; sc.ingenico_managed += 5; }
  if (geo === "europe") { Object.keys(sc).forEach((k) => { sc[k] = -100; }); }

  if (size === "enterprise") { sc.ingenico_managed += 10; sc.pax_mercury += 8; sc.pax_weblink += 6; sc.evo_uci -= 5; sc.evo_local_api -= 3; sc.gp_tom -= 5; }
  if (size === "smb") { sc.evo_uci += 8; sc.evo_local_api += 8; sc.evo_intents += 6; sc.gp_tom += 5; sc.pax_mercury += 3; }
  if (size === "mid_market") { sc.pax_mercury += 5; sc.evo_uci += 5; sc.ingenico_managed += 3; }

  if (isv === "isv") { sc.evo_uci += 10; sc.pax_mercury += 8; sc.ingenico_managed -= 3; }
  if (isv === "merchant") { sc.ingenico_managed += 8; sc.pax_weblink += 5; sc.evo_local_api += 5; }

  if (integ === "cloud") { sc.pax_mercury += 15; sc.evo_uci += 15; sc.ingenico_managed -= 10; sc.pax_weblink -= 10; sc.pax_app2app -= 10; sc.evo_local_api -= 10; sc.evo_intents -= 10; sc.gp_tom -= 5; }
  if (integ === "local") { sc.pax_weblink += 15; sc.evo_local_api += 15; sc.ingenico_managed += 10; sc.pax_mercury -= 5; sc.evo_uci -= 5; }
  if (integ === "app2app") { sc.pax_app2app += 15; sc.evo_intents += 15; sc.ingenico_managed -= 10; sc.pax_mercury -= 10; sc.pax_weblink -= 10; }
  if (integ === "standalone") { sc.ingenico_managed += 15; sc.evo_local_api += 5; sc.gp_tom += 5; sc.pax_mercury -= 5; sc.evo_uci -= 5; }

  if (form === "countertop") { sc.ingenico_managed += 5; sc.evo_local_api += 3; }
  if (form === "mobile") { sc.gp_tom += 10; sc.pax_mercury += 3; sc.evo_uci += 3; }
  if (form === "pinpad") { sc.evo_uci += 8; sc.evo_local_api += 8; sc.ingenico_managed += 5; }
  if (form === "unattended") { sc.self_service_kiosk += 15; sc.evo_uci += 8; sc.evo_local_api += 8; sc.gp_tom -= 10; }
  if (form === "mixed") { sc.evo_uci += 8; sc.evo_local_api += 8; sc.ingenico_managed += 3; }

  if (report === "critical") { sc.pax_mercury += 8; sc.ingenico_managed += 8; sc.pax_weblink += 5; sc.evo_uci -= 5; sc.evo_local_api -= 5; sc.evo_intents -= 5; }
  if (report === "basic") { sc.evo_uci += 3; sc.evo_local_api += 3; }

  if (p2pe === "yes") { sc.ingenico_managed += 15; sc.pax_mercury -= 5; sc.evo_uci -= 5; }

  if (stack === "greenhouse") { sc.pax_mercury += 10; sc.ingenico_managed += 8; sc.pax_weblink += 5; sc.evo_uci -= 10; }
  if (stack === "eservice") { sc.evo_uci += 8; sc.evo_local_api += 8; sc.pax_mercury += 3; }

  if (timeline === "urgent") { sc.evo_uci -= 5; sc.ingenico_managed += 3; }
  if (timeline === "long_term") { sc.evo_uci += 3; sc.pax_mercury += 2; }

  const sorted = Object.entries(sc).filter(([_, s]) => s > -50).sort((a, b) => b[1] - a[1]);
  const primary = SOLUTIONS[sorted[0]?.[0]];
  const alternatives = sorted.slice(1, 3).filter(([_, s]) => s > 0).map(([k]) => SOLUTIONS[k]);

  const reasoning = [];
  if (geo === "uk_ireland" || geo === "ireland") reasoning.push("Ireland coverage eliminates Mercury and PAX POSitive stacks (UK-only today). UCI + eService is the only cloud middleware supporting both markets.");
  if (size === "enterprise" && primary?.host?.includes("eService") && !primary?.host?.includes("Greenhouse")) reasoning.push("⚠ Enterprise merchants typically prefer Greenhouse for its superior My Account reporting. The recommended eService stack uses BRC which is less mature — discuss reporting needs carefully.");
  if (size === "enterprise" && primary?.host?.includes("Greenhouse")) reasoning.push("Greenhouse stack provides enterprise-grade reporting via My Account with API access — well suited for this merchant's scale.");
  if (isv === "isv") reasoning.push("Since this is ISV-led, engage the Partner Acquisition team first. They need to assess the broader partnership opportunity before any technical conversations. The ISV must bring more than just this one merchant.");
  if (isv === "merchant" && integ === "cloud") reasoning.push("For merchant-led cloud integrations, identify the ISV and confirm they have a broader pipeline. GP rarely entertains cloud integrations for a single merchant.");
  if (p2pe === "yes" && !primary?.p2pe) reasoning.push("⚠ P2PE is required but the recommended solution doesn't support it. Consider Ingenico Managed Service for P2PE, or discuss flexibility with the merchant.");
  if (stack === "greenhouse" && primary?.id?.startsWith("evo")) reasoning.push("⚠ Merchant is currently on Greenhouse. Moving to eService-only (UCI) requires re-boarding and losing My Account reporting. Mercury preserves the Greenhouse relationship.");
  if (timeline === "urgent" && primary?.id === "evo_uci") reasoning.push("⚠ UCI is still in pilot. Confirm availability with the product team before committing.");
  if (integ === "cloud") reasoning.push("Cloud integration uses middleware (Mercury or UCI) sitting on the terminal. The middleware intercepts cloud messages and translates them into app-to-app calls to the payment application. All processing and security is handled by the payment app itself.");

  return { primary, alternatives, reasoning };
}

// ─── Palette ────────────────────────────────────────────────────────────────
const c = {
  bg: "#07090f", card: "#0f1219", cardAlt: "#141a24", cardHover: "#181f2e",
  border: "#1c2536", borderLight: "#253045",
  accent: "#4f8ff7", accentDim: "#3a6ec4", accentG: "rgba(79,143,247,0.08)", accentG2: "rgba(79,143,247,0.15)",
  green: "#34d399", greenG2: "rgba(52,211,153,0.15)",
  amber: "#fbbf24", amberG: "rgba(251,191,36,0.08)",
  text: "#c9d1d9", muted: "#8b949e", dim: "#58616b", white: "#ecf0f5",
};

// ─── ContextPanel (collapsible) ─────────────────────────────────────────────
function ContextPanel({ contextKey }) {
  const [open, setOpen] = useState(false);
  const ctx = CONTEXT[contextKey];
  if (!ctx) return null;

  return (
    <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", background: "transparent", border: "none", cursor: "pointer", color: c.text, textAlign: "left",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: c.accent, padding: "2px 7px", background: c.accentG2, borderRadius: 3, fontFamily: "'JetBrains Mono', monospace" }}>CONTEXT</span>
          <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>{ctx.title}</span>
        </div>
        <span style={{ fontSize: 16, color: c.dim, transition: "transform 0.3s", transform: open ? "rotate(180deg)" : "rotate(0)", lineHeight: 1, flexShrink: 0, marginLeft: 8 }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: "0 16px 16px", animation: "fadeIn 0.25s ease-out" }}>
          {ctx.subtitle && <p style={{ fontSize: 12, color: c.accent, marginBottom: 8, fontWeight: 500 }}>{ctx.subtitle}</p>}
          <p style={{ fontSize: 12.5, color: c.text, lineHeight: 1.7, marginBottom: ctx.flow || ctx.detail ? 12 : 0 }}>{ctx.description}</p>
          {ctx.flow && (
            <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "14px 10px", background: c.bg, borderRadius: 8, border: `1px solid ${c.border}`, marginBottom: ctx.detail ? 12 : 0, overflowX: "auto" }}>
              {ctx.flow.map((step, i) => (
                step === "→" ? (
                  <div key={i} style={{ padding: "0 5px", color: c.accent, fontSize: 15, fontWeight: 300, flexShrink: 0 }}>→</div>
                ) : (
                  <div key={i} style={{ padding: "7px 10px", background: c.cardAlt, border: `1px solid ${c.borderLight}`, borderRadius: 5, fontSize: 10.5, color: c.white, textAlign: "center", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "pre-line", lineHeight: 1.4, minWidth: 72, flexShrink: 0 }}>
                    {step}
                  </div>
                )
              ))}
            </div>
          )}
          {ctx.detail && (
            <p style={{ fontSize: 12, color: c.muted, lineHeight: 1.6, padding: "9px 12px", background: c.accentG, borderLeft: `2px solid ${c.accentDim}`, borderRadius: "0 5px 5px 0" }}>
              {ctx.detail}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── QuestionCard ───────────────────────────────────────────────────────────
function QuestionCard({ question, onAnswer, currentAnswer }) {
  let ctxKey = question.contextKey;
  if (question.dynamicContext && currentAnswer) {
    ctxKey = question.dynamicContext[currentAnswer] || ctxKey;
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: c.white, marginBottom: 8, lineHeight: 1.4, fontFamily: "'Space Grotesk', sans-serif" }}>
        {question.question}
      </h2>
      <p style={{ fontSize: 12, color: c.dim, marginBottom: 22, lineHeight: 1.65, padding: "9px 13px", background: c.accentG, borderLeft: `2px solid ${c.accentDim}`, borderRadius: "0 5px 5px 0" }}>
        {question.why}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {question.options.map((opt) => {
          const sel = currentAnswer === opt.value;
          return (
            <button key={opt.value} onClick={() => onAnswer(question.id, opt.value)}
              style={{
                padding: "12px 15px", background: sel ? c.accentG2 : c.card,
                border: `1px solid ${sel ? c.accent : c.border}`, borderRadius: 8,
                color: sel ? c.white : c.text, fontSize: 13, fontWeight: sel ? 600 : 400,
                cursor: "pointer", textAlign: "left", transition: "all 0.15s ease",
                fontFamily: "'Space Grotesk', sans-serif", outline: "none",
              }}
              onMouseEnter={(e) => { if (!sel) { e.target.style.background = c.cardHover; e.target.style.borderColor = c.dim; } }}
              onMouseLeave={(e) => { if (!sel) { e.target.style.background = c.card; e.target.style.borderColor = c.border; } }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
                <span style={{
                  width: 15, height: 15, borderRadius: "50%",
                  border: `2px solid ${sel ? c.accent : c.dim}`,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, background: sel ? c.accent : "transparent", transition: "all 0.15s",
                }}>
                  {sel && <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.white }} />}
                </span>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
      {ctxKey && <div style={{ marginTop: 18 }}><ContextPanel contextKey={ctxKey} /></div>}
    </div>
  );
}

// ─── FlowDiagram (always visible in recommendations) ────────────────────────
function FlowDiagram({ solutionId }) {
  const flow = SOLUTION_FLOWS[solutionId];
  if (!flow) return null;

  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10,
      padding: 16, marginBottom: 14,
    }}>
      <div style={{
        fontSize: 9, color: c.accent, marginBottom: 14,
        fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.5,
        display: "flex", alignItems: "center", gap: 7,
      }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${c.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, lineHeight: 1 }}>⬡</span>
        {flow.title.toUpperCase()}
      </div>

      <div style={{
        display: "flex", alignItems: "stretch", gap: 0,
        overflowX: "auto", paddingBottom: 4,
      }}>
        {flow.layers.map((layer, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80 }}>
              <div style={{
                fontSize: 8, fontWeight: 700, letterSpacing: 1.2, color: layer.color,
                marginBottom: 6, fontFamily: "'JetBrains Mono', monospace",
                textAlign: "center", opacity: 0.85,
              }}>
                {layer.label}
              </div>
              <div style={{
                padding: "10px 10px", background: c.card,
                border: `1.5px solid ${layer.color}30`,
                borderRadius: 7, fontSize: 10.5, color: c.white,
                textAlign: "center", fontFamily: "'JetBrains Mono', monospace",
                whiteSpace: "pre-line", lineHeight: 1.45, minWidth: 80,
                boxShadow: `0 0 12px ${layer.color}10`,
                position: "relative",
              }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 2,
                  background: layer.color, borderRadius: "7px 7px 0 0", opacity: 0.6,
                }} />
                {layer.node}
              </div>
            </div>
            {i < flow.layers.length - 1 && (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "flex-end", padding: "0 4px", paddingTop: 18,
              }}>
                <svg width="24" height="12" viewBox="0 0 24 12" style={{ flexShrink: 0 }}>
                  <line x1="0" y1="6" x2="18" y2="6" stroke={c.dim} strokeWidth="1.5" strokeDasharray="3,2" />
                  <polygon points="18,2 24,6 18,10" fill={c.dim} />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      <p style={{
        fontSize: 11.5, color: c.muted, lineHeight: 1.6, marginTop: 12,
        padding: "8px 11px", background: `${c.card}`, borderRadius: 6,
        borderLeft: `2px solid ${c.accentDim}`,
      }}>
        {flow.note}
      </p>
    </div>
  );
}

// ─── SolutionCard ───────────────────────────────────────────────────────────
function SolutionCard({ solution, isAlt }) {
  const bdr = isAlt ? c.border : c.green;
  const badge = isAlt ? "ALTERNATIVE" : "RECOMMENDED";
  const badgeC = isAlt ? c.amber : c.green;
  const badgeBg = isAlt ? c.amberG : c.greenG2;

  return (
    <div style={{ background: c.card, border: `1px solid ${bdr}`, borderRadius: 11, padding: 20, marginBottom: 12, boxShadow: isAlt ? "none" : `0 0 35px ${c.greenG2}` }}>
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: badgeC, padding: "2px 7px", background: badgeBg, borderRadius: 3, fontFamily: "'JetBrains Mono', monospace" }}>{badge}</span>

      <h3 style={{ fontSize: 18, fontWeight: 700, color: c.white, marginTop: 12, marginBottom: 3, fontFamily: "'Space Grotesk', sans-serif" }}>{solution.name}</h3>
      <p style={{ fontSize: 12, color: c.accent, marginBottom: 12, fontWeight: 500 }}>{solution.category}</p>
      <p style={{ fontSize: 12.5, color: c.text, lineHeight: 1.7, marginBottom: 16 }}>{solution.ideal}</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[
          { l: "Acquiring Host", v: solution.host },
          { l: "Geography", v: solution.geography.join(", ") },
          { l: "Integration", v: solution.integration },
          { l: "Reporting", v: solution.reporting },
        ].map((item) => (
          <div key={item.l} style={{ padding: "8px 10px", background: c.bg, borderRadius: 5, border: `1px solid ${c.border}` }}>
            <div style={{ fontSize: 9, color: c.dim, marginBottom: 2, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, textTransform: "uppercase" }}>{item.l}</div>
            <div style={{ fontSize: 11.5, color: c.text, lineHeight: 1.4 }}>{item.v}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, color: c.dim, marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>TERMINALS</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {solution.terminals.map((t) => (
            <span key={t} style={{ fontSize: 10.5, padding: "3px 7px", background: c.bg, border: `1px solid ${c.border}`, borderRadius: 4, color: c.muted }}>{t}</span>
          ))}
        </div>
      </div>

      {!isAlt && <FlowDiagram solutionId={solution.id} />}

      {isAlt && SOLUTION_FLOWS[solution.id] && (
        <div style={{ marginBottom: 12 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 0,
            padding: "10px 8px", background: c.bg, borderRadius: 7,
            border: `1px solid ${c.border}`, overflowX: "auto",
          }}>
            {SOLUTION_FLOWS[solution.id].layers.map((layer, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <div style={{
                  padding: "5px 8px", background: c.card,
                  border: `1px solid ${layer.color}25`, borderRadius: 5,
                  fontSize: 9.5, color: c.white, textAlign: "center",
                  fontFamily: "'JetBrains Mono', monospace",
                  whiteSpace: "pre-line", lineHeight: 1.3, minWidth: 60,
                }}>
                  {layer.node}
                </div>
                {i < SOLUTION_FLOWS[solution.id].layers.length - 1 && (
                  <span style={{ padding: "0 3px", color: c.dim, fontSize: 12, flexShrink: 0 }}>→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isAlt && solution.considerations.length > 0 && (
        <div>
          <div style={{ fontSize: 9, color: c.amber, marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>WATCH OUT FOR</div>
          {solution.considerations.map((x, i) => (
            <div key={i} style={{ fontSize: 11.5, color: c.muted, lineHeight: 1.6, paddingLeft: 13, position: "relative", marginBottom: 2 }}>
              <span style={{ position: "absolute", left: 0, color: c.amber }}>→</span>{x}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── RecommendationView ─────────────────────────────────────────────────────
function RecommendationView({ answers, onReset }) {
  const result = generateRecommendation(answers);
  return (
    <div style={{ animation: "fadeIn 0.4s ease-out" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: c.greenG2, border: `2px solid ${c.green}`, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12, fontSize: 18 }}>✓</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: c.white, marginBottom: 5, fontFamily: "'Space Grotesk', sans-serif" }}>Assessment Complete</h2>
        <p style={{ fontSize: 12.5, color: c.muted, maxWidth: 460, margin: "0 auto" }}>Recommended solution with alternatives and reasoning based on your inputs.</p>
      </div>

      {result.reasoning.length > 0 && (
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 9, padding: 16, marginBottom: 18 }}>
          <div style={{ fontSize: 9, color: c.accent, marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>REASONING & NEXT STEPS</div>
          {result.reasoning.map((r, i) => (
            <p key={i} style={{ fontSize: 12, color: c.text, lineHeight: 1.7, marginBottom: i < result.reasoning.length - 1 ? 7 : 0 }}>{r}</p>
          ))}
        </div>
      )}

      {result.primary && <SolutionCard solution={result.primary} isAlt={false} />}

      {result.alternatives.length > 0 && (
        <>
          <div style={{ fontSize: 9, color: c.dim, margin: "18px 0 8px", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>ALTERNATIVES</div>
          {result.alternatives.map((alt) => <SolutionCard key={alt.id} solution={alt} isAlt={true} />)}
        </>
      )}

      <button onClick={onReset} style={{
        width: "100%", padding: "12px 18px", marginTop: 18, background: c.card,
        border: `1px solid ${c.border}`, borderRadius: 8, color: c.text, fontSize: 13,
        fontWeight: 500, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif",
      }}>↻ Start New Assessment</button>

      <div style={{ marginTop: 20, padding: 12, background: c.card, border: `1px solid ${c.border}`, borderRadius: 7 }}>
        <div style={{ fontSize: 9, color: c.dim, marginBottom: 6, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>YOUR INPUTS</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
          {Object.entries(answers).map(([qId, val]) => {
            const q = QUESTIONS.find((q) => q.id === qId);
            const opt = q?.options.find((o) => o.value === val);
            return <div key={qId} style={{ fontSize: 10.5, color: c.muted }}><span style={{ color: c.dim }}>{qId}: </span>{opt?.label || val}</div>;
          })}
        </div>
      </div>
    </div>
  );
}

// ─── ProgressBar ────────────────────────────────────────────────────────────
function ProgressBar({ current, total }) {
  const pct = (current / total) * 100;
  return (
    <div style={{ width: "100%", marginBottom: 26 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7, fontSize: 10, color: c.dim, fontFamily: "'JetBrains Mono', monospace" }}>
        <span>QUESTION {current} / {total}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div style={{ width: "100%", height: 2, background: c.border, borderRadius: 1, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${c.accent}, ${c.green})`, borderRadius: 1, transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)" }} />
      </div>
    </div>
  );
}

// ─── App ────────────────────────────────────────────────────────────────────
export default function MerchantAssessment() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);

  const filtered = QUESTIONS.filter((q) => {
    if (q.id === "p2pe" && answers.merchant_size === "smb") return false;
    return true;
  });
  const current = filtered[step];
  const total = filtered.length;
  const canGo = current && answers[current.id];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
      <div style={{ minHeight: "100vh", background: c.bg, color: c.text, fontFamily: "'Space Grotesk', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: "26px 16px" }}>
        <div style={{ width: "100%", maxWidth: 580, marginBottom: 26, textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 11px", background: c.card, border: `1px solid ${c.border}`, borderRadius: 5, fontSize: 10, color: c.dim, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.2, marginBottom: 16 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.green }} />GP IN-PERSON POS ADVISOR
          </div>
          <h1 style={{ fontSize: 25, fontWeight: 700, color: c.white, marginBottom: 5 }}>Merchant Solution Assessment</h1>
          <p style={{ fontSize: 12.5, color: c.muted, maxWidth: 420, margin: "0 auto" }}>Answer targeted questions to identify the right in-person payment solution.</p>
        </div>

        <div style={{ width: "100%", maxWidth: 580 }}>
          {!done ? (
            <>
              <ProgressBar current={step + 1} total={total} />
              {current && <QuestionCard key={current.id} question={current} onAnswer={(id, v) => setAnswers((p) => ({ ...p, [id]: v }))} currentAnswer={answers[current.id]} />}
              <div style={{ display: "flex", gap: 9, marginTop: 22 }}>
                {step > 0 && (
                  <button onClick={() => setStep((s) => s - 1)} style={{ padding: "11px 18px", background: c.card, border: `1px solid ${c.border}`, borderRadius: 7, color: c.muted, fontSize: 13, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" }}>← Back</button>
                )}
                <button onClick={() => step < total - 1 ? setStep((s) => s + 1) : setDone(true)} disabled={!canGo}
                  style={{ flex: 1, padding: "11px 18px", background: canGo ? c.accent : c.border, border: "none", borderRadius: 7, color: canGo ? "#fff" : c.dim, fontSize: 13, fontWeight: 600, cursor: canGo ? "pointer" : "not-allowed", fontFamily: "'Space Grotesk', sans-serif", opacity: canGo ? 1 : 0.5, transition: "all 0.15s" }}>
                  {step === total - 1 ? "Get Recommendation →" : "Continue →"}
                </button>
              </div>
            </>
          ) : (
            <RecommendationView answers={answers} onReset={() => { setStep(0); setAnswers({}); setDone(false); }} />
          )}
        </div>
        <div style={{ marginTop: 36, fontSize: 9, color: c.dim, fontFamily: "'JetBrains Mono', monospace" }}>GLOBAL PAYMENTS — IN-PERSON SOLUTIONS</div>
      </div>
    </>
  );
}
