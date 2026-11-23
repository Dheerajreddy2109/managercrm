/**
 * Source: Team_Employee_Workspace.xlsx (summary sheet + each employee tab), imported Nov 2026.
 * Edit here and run `npm run db:seed` to reload EVERYTHING (wipes the database first).
 */

/** Sheet status → app status. */
export type SheetStatus = "Ongoing" | "On Hold" | "Completed" | "Upcoming" | "";
/** [project, tech, due (YYYY-MM-DD or ""), status, priority, notes, progress % (from summary sheet) ] */
export type Assign = [string, string, string, SheetStatus, "High" | "Medium" | "Low" | "", string, number?, string?];
/** [date, project, title, estimate text, status, notes, checklist items?, description?] */
export type Daily = [string, string, string, string, "Completed" | "In Progress" | "Not Started" | "", string, string[]?, string?];

export type Employee = {
  name: string;
  techStack: string;
  device?: string;
  specs?: string;
  issue?: string;
  availableFrom?: string;
  projects: Assign[];
  daily: Daily[];
};

/** Spelling variants in the sheets → one project name. Keys are lowercase letters/digits only. */
export const PROJECT_ALIASES: Record<string, string> = {
  vizagchanbers: "Vizag Chambers", vizagchambers: "Vizag Chambers",
  howpa: "Howpa", howpadoctorapp: "Howpa",
  mytownnews: "My Town News",
  rhockdeal: "RhockDeal", rockdeal: "RhockDeal",
  srikumammilk: "Srikumam Milk", srikumamilk: "Srikumam Milk",
  jyothiyalaam: "Jyothiyalaam", srijyothiyalam: "Jyothiyalaam",
  gayatriastro: "Gayatri Astro", gayatri: "Gayatri Astro",
  digitweets: "Digitweets", digitwits: "Digitweets",
  glownesty: "Glow Nesty",
  hoteljas: "Hotel Jas",
  saiproperties: "Sai Properties", ssiproperties: "Sai Properties",
  gvptax: "GVP Tax", gvptaxservices: "GVP Tax",
  theplacementmaker: "The Placement Maker",
  bulebulls: "Blue Bulls",
  arp: "ARP Infra Solutions", arpinfrasolutions: "ARP Infra Solutions",
  taxclick: "TaxClick",
  visakhavalley: "Visakha Valley", visakavally: "Visakha Valley", visakavalley: "Visakha Valley",
  maxwill: "MaxWill", maxwell: "MaxWill", maxvill: "MaxWill",
  vooket: "Vooket", vooked: "Vooket", vooketapp: "Vooket",
  legendsfood: "Legends Food", legendfoods: "Legends Food", lengendfoods: "Legends Food",
  speedyserve: "Speedy Serve (Bus Booking App)", speedyservebusbookingapp: "Speedy Serve (Bus Booking App)",
  mepstock: "MEPSTOCK",
  bandvagan: "Bandvagon", bandvagon: "Bandvagon",
  vinseva: "Vinseva",
  arakueats: "Araku Eats",
};

export const TEAM: Employee[] = [
  {
    name: "Maneeswar", techStack: "Node & PHP", device: "ThinkPad", specs: "i5, 8GB RAM", availableFrom: "2026-11-16",
    projects: [
      ["Vizag Chambers", "PHP", "", "On Hold", "", "Need SMTP details and payment gateway (pending from client)"],
      ["Howpa", "Node", "", "Ongoing", "", "Bugs testing and fixing"],
      ["My Town News", "Node", "", "Completed", "", "Need to connect Cloudflare CDN"],
      ["Chiripi", "Node", "", "Ongoing", "", "Need to do testing (uploading today)"],
    ],
    daily: [
      ["2026-11-12", "Howpa", "Bugs fixing", "eod", "", ""],
      ["2026-11-12", "Medlines", "Make it live", "1 hour", "Completed", ""],
      ["2026-11-12", "Bandvagon", "KT for modules phase 2", "", "Not Started", "Meeting not done"],
      ["2026-11-12", "Visnika", "Add content brochures", "", "", ""],
      ["2026-11-16", "Chiripi", "Chiripi fixes", "eod", "", "", ["Auto pay on and off", "Banner checking", "Individual language home page filter", "Check other and admin fixes"]],
      ["2026-11-16", "High Delivery", "Support task", "", "", ""],
    ],
  },
  {
    name: "Karthik", techStack: "Node", device: "Dell", specs: "i5, 16GB RAM", issue: "Hangs and not working properly when running Node", availableFrom: "2026-11-16",
    projects: [
      ["RCS Barrus", "Node", "2026-06-26", "On Hold", "High", "Development completed, waiting for client to go live (client side delay)", 100],
      ["Digitweets", "Node", "", "Ongoing", "Medium", "Payslips and payments — evalli"],
      ["RhockDeal", "Node", "2026-08-15", "Completed", "Medium", "Completed but production issues:\n1. SMS 50 templates (need to add)\n2. Redirections issue\n3. Location, views and clicks working only on some devices", 100],
      ["Vyben", "Node", "2026-08-31", "On Hold", "Low", "Client needs to provide approval. Client is not responding. Need to start"],
      ["Sri Sai Construction", "Node", "2026-09-15", "Completed", "Medium", "Project completed in live", 100],
      ["Srikumam Milk", "Node", "2026-09-25", "Completed", "High", "Published to Play Store, in review (client side delay)", 100],
      ["Jas Fresh Meat", "Node", "2026-09-13", "On Hold", "Medium", "Third-party integrations pending from client side. Client payment pending", 100],
      ["Sun Computer", "Node", "2026-09-15", "Completed", "Low", "Once approval is received we can proceed with live. Pending with Basha sir", 100],
      ["Jyothiyalaam", "Node", "", "Ongoing", "Low", "Need to add APIs (2) — integrations pending", 80],
      ["IESS Industrial Solution", "Node", "", "Completed", "", "", 100],
    ],
    daily: [
      ["2026-11-12", "Gayatri Astro", "Horoscope, marriage matching, edit profile", "today eod", "Completed", "", ["Horoscope", "Marriage matching compatibility", "Place of birth and gothram", "Edit profile add-ons"]],
      ["2026-11-12", "Digitweets", "SEO, projects history and SMTP integration", "30 mins", "Completed", ""],
      ["2026-11-13", "Gayatri Astro", "Horoscope API output mismatch", "eod", "In Progress", "", undefined, "In the horoscope we use multiple APIs, and when we filter the data it fetches 2 different types of output for the same field, so we need to work on that."],
      ["2026-11-13", "Gayatri Astro", "In one profile", "eod", "In Progress", ""],
      ["2026-11-16", "Glow Nesty", "Meeting for new website", "", "", ""],
      ["2026-11-17", "Glow Nesty", "Home page changes", "3 hours", "", ""],
      ["2026-11-17", "RhockDeal", "SMS templates (50)", "one day", "", ""],
    ],
  },
  {
    name: "Sai Shankar", techStack: "Node", device: "Lenovo", specs: "i5, 16GB RAM", issue: "Keyboard issue", availableFrom: "2026-11-13",
    projects: [
      ["Hotel Jas", "Node", "2026-07-25", "Completed", "Medium", "Completed"],
      ["Sai Properties", "Node", "", "Ongoing", "Medium", "10 modules medha naku idea vundi mam. Ippudu mrng Kiran sir msg chesaru like cheque management module lo issues vunnayi ani client annaru, so adi motham module malli re-check chesi cheppamannaru — chesi update icesaa mam. Next accounting module lo TDS, Suraksha deduction check chesi malli full module re-check cheyamanru, so adi check chestuna."],
    ],
    daily: [
      ["2026-11-13", "Sai Properties", "Client changes", "", "", "Pending from client — they have to share changes"],
    ],
  },
  {
    name: "Sai Kiran", techStack: "Node", device: "Asus", specs: "i5, 12GB RAM", issue: "Getting shock and speakers not working", availableFrom: "2026-10-30",
    projects: [
      ["Amcart", "Node", "", "Completed", "Medium", "Need to provide the demo (client changes delay)", 100],
      ["Acts on Mission", "Node", "2026-07-30", "On Hold", "Medium", "Development completed, waiting for client (client hold)", 100],
      ["Sri Vidya", "Node", "2026-08-22", "Completed", "Medium", "Live completed", 100],
      ["OmegaGroupLTD", "Node", "2026-09-15", "Completed", "Medium", "Live completed", 100],
      ["Omi Astro", "Node", "2026-08-26", "On Hold", "Medium", "Waiting for client approval of new changes", 100],
      ["Virloyx", "Node", "2026-11-02", "Completed", "High", "Waiting for client approval to make live", 100],
      ["The Placement Maker", "Node", "", "Ongoing", "Medium", "After approval need to convert into Node (client side delay)", 25],
      ["Puja Vedika", "Node", "", "On Hold", "Medium", "Need to implement WhatsApp APIs (client needs to give) — client side delay", 80],
      ["Blue Bulls", "Node", "", "On Hold", "Medium", "Complete but waiting for payment", 100],
      ["Zenvy", "Node", "", "Ongoing", "Medium", "Making dynamic pages", 70],
      ["GVP Tax", "Node", "2026-11-11", "Completed", "Medium", "We started dynamic", 100],
      ["Arogya Wealth Mart", "Node", "", "Ongoing", "Medium", "Testing SMS templates"],
    ],
    daily: [
      ["2026-11-12", "Zenvy", "Staff, dealer and distributor pages — website pages dynamic", "today eod", "Completed", "Done, but need to implement the functionality"],
      ["2026-11-12", "GVP Tax", "SMTP implementation", "2 hours", "Completed", ""],
      ["2026-11-13", "Zenvy", "Dealer panel, customer panel dynamic flow", "eod (inform)", "", ""],
      ["2026-11-16", "Zenvy", "Dealer panel client meeting for changes", "", "", ""],
      ["2026-11-16", "Zenvy", "Privacy policy dynamic", "50 mins", "", ""],
      ["2026-11-16", "ARP Infra Solutions", "Home pages, inner pages", "", "", ""],
      ["2026-11-17", "Zenvy", "Admin, customer and dealer panels", "eod", "", "Working on customer panel"],
    ],
  },
  {
    name: "Chandradeep", techStack: "Node", availableFrom: "2026-10-10",
    projects: [
      ["Apna Help QR", "Node", "2026-08-27", "Completed", "High", "Project completed"],
      ["Subhakanuka", "Node", "", "Ongoing", "High", "Add-on vundhi annaru, working on it — need to check with Hema"],
      ["Grab Days", "Node", "2026-10-31", "Upcoming", "High", "Yet to start"],
      ["Go Andhra", "Node", "2026-08-15", "Completed", "Medium", "Payment not received, we want to stop the server"],
      ["Bed Craft", "Node", "", "Completed", "Medium", "Completed in live"],
      ["TaxClick", "Node", "2026-10-10", "Completed", "Medium", "Need to provide demo to client"],
      ["E-commerce", "Node", "2026-10-17", "Completed", "Medium", "Client side delay (client needs to confirm)"],
      ["agrievents.in", "Node", "2026-11-04", "Ongoing", "Medium", "Ongoing"],
      ["A to Z", "Node", "2026-10-30", "Upcoming", "Medium", "Yet to start"],
      ["Venkar", "Node", "2026-09-15", "Completed", "Medium", "Project in live"],
    ],
    daily: [],
  },
  {
    name: "Ravi Kiran", techStack: "Node & PHP", availableFrom: "2026-10-15",
    projects: [
      ["Wedding Help", "PHP", "2026-08-31", "Ongoing", "Medium", "Add-on vundhi annaru but client needs to confirm"],
      ["Vizag Christian Assembly", "PHP", "2026-09-05", "Completed", "Medium", "Development completed"],
      ["ITG Homes", "PHP", "", "Completed", "Medium", "Backend admin points development (wallet DR/CR functionality along with reviews active/inactive config). Complete applications and admin panel testing"],
      ["B Well Physio Care", "PHP", "2026-08-31", "Ongoing", "Medium", "Need to provide the demo to client"],
      ["PinkBowl", "PHP", "2026-08-31", "Completed", "High", "It was in live, but there are issues to fix"],
      ["Dantara Jewellery", "Node", "2026-08-31", "Completed", "Medium", "Completed, need to send to live once approved"],
      ["Amity", "PHP", "2026-09-30", "Completed", "High", "Client needs to confirm for live"],
      ["MHH", "Node", "", "Ongoing", "Medium", "Tomorrow evening — 6 points pending, working on it"],
    ],
    daily: [],
  },
  {
    name: "Lalith", techStack: "Node", device: "HP EliteBook", specs: "i7, 24GB RAM", availableFrom: "2026-11-16",
    projects: [
      ["Chandan Valley", "Node", "2026-07-25", "On Hold", "High", "Client side delay, need approval for live (client not responding)", 100],
      ["VBC", "Node", "", "Completed", "Medium", "Client side pending. Once confirmed we need to make live (need to deploy app — access pending from client)", 100],
      ["Weat Rich", "Node", "2026-07-25", "On Hold", "Medium", "Client needs to provide third-party integration (WhatsApp / SMS / mail). Client side delay. Has support work", 100],
      ["Purple Stay", "Node", "2026-10-15", "Completed", "Low", "All details completed; will go live once client confirms. Third-party integrations pending from client", 90],
      ["Araku Eats", "Node", "2026-10-31", "Ongoing", "High", "User app and vendor app completed, rider app in progress. 3rd party pending from client", 90],
      ["Local Baba", "Node", "2026-10-31", "Ongoing", "High", "Support work", 100],
      ["Legends Food", "Node", "2026-11-30", "Upcoming", "Low", "Yet to start — clone of Araku Eats"],
      ["Rizhq", "Node", "", "Ongoing", "", "Clone of Araku Eats"],
    ],
    daily: [
      ["2026-11-12", "iMedhas", "htaccess issue", "40 mins", "Completed", ""],
      ["2026-11-12", "Bhramamuki", "UI changes and dynamic changes", "2 hours", "Completed", ""],
      ["2026-11-13", "Araku Eats", "Payouts and settlements", "", "", "Need to ask Subbu sir"],
      ["2026-11-17", "Rizhq", "Clone of Araku Eats", "eod", "", ""],
    ],
  },
  {
    name: "Harsha", techStack: "Node & Flutter",
    projects: [
      ["Arena Water Park", "", "", "", "", ""],
      ["Taxi Booking", "", "", "", "", ""],
      ["Pet U", "", "", "", "", ""],
      ["Ramuji Films", "", "", "", "", ""],
    ],
    daily: [],
  },
  {
    name: "Chinni Vijay Kumar", techStack: "Node & Flutter",
    projects: [
      ["Runbro", "Flutter", "", "Ongoing", "", "Implementation of new functionalities and UI modifications based on client requirements"],
      ["Bandvagon", "Flutter", "", "Ongoing", "", "Implementation of additional features and add-on functionalities"],
      ["VM Farm Fresh", "Ionic", "", "Ongoing", "", "Identification, troubleshooting and resolution of reported issues"],
      ["Doctrine", "Flutter", "", "Ongoing", "", "Minor changes and enhancements to the Agora meeting module"],
      ["Zetspeed", "Flutter", "", "Ongoing", "", "Deployment and release of the application on the Google Play Store"],
      ["DMK Bazar", "Flutter", "", "Ongoing", "", "Implementation of add-on points and resolution of existing application issues"],
      ["MEPSTOCK", "Flutter", "", "Ongoing", "", "No pending issues currently. Will handle any new issues or changes that arise"],
      ["MHH", "Flutter", "", "Ongoing", "", "Additional features, issue resolution and UI enhancements based on client requirements"],
      ["Zospin", "Flutter", "", "Ongoing", "", ""],
      ["Dr Wound", "Flutter", "", "Ongoing", "", "Meetings to discuss and resolve project issues. Implementing the Nurse module for the iOS app. Minor changes and enhancements based on requirements"],
    ],
    daily: [
      ["2026-11-16", "Dr Wound", "Add parameter in API and meeting (nurse app)", "", "", ""],
      ["2026-11-16", "Doctrine", "Agora meeting module changes", "", "", ""],
      ["2026-11-16", "VM Farm Fresh", "Issues fixing", "", "", "", ["Update form (profile, email)", "Wallet subscription (general wallet)", "Milk subscription", "Pay 30 days at a time", "Auto-update", "Cart count", "Admin panel – refund button"]],
      ["2026-11-16", "Zospin", "Support work for 3rd-party integration", "", "", ""],
    ],
  },
  { name: "Pavan Varma", techStack: "Flutter", availableFrom: "2026-09-30", projects: [], daily: [] },
  {
    name: "Vamshi", techStack: "Flutter", device: "Dell", specs: "i5, 16GB RAM", issue: "Not working properly, hangs", availableFrom: "2026-11-13",
    projects: [
      ["Vinseva", "Flutter", "", "On Hold", "High", "2 modules, 5 apps (Professional one). Fixing bugs — Monday EOD"],
      ["RhockDeal", "Flutter", "", "On Hold", "Medium", "Bugs and templates in progress"],
      ["Srikumam Milk", "Flutter", "", "On Hold", "Low", "Third-party integrations pending"],
      ["Jyothiyalaam", "Node", "", "Ongoing", "High", "Client changes (UI changes and bug fixing)"],
    ],
    daily: [
      ["2026-11-12", "Gayatri Astro", "UI changes and bug fixing", "today eod", "Completed", "Submitted to client by BDE Karthik", ["Marriage matching", "Horoscope", "Change profile photo", "Current location and search locations in Rasipalalu", "Birth time", "Place of birth", "Gothram"]],
      ["2026-11-12", "Vinseva", "User app issues", "", "In Progress", "Build is failing", ["Auto logout issue", "FAQ issue", "Build app failed"]],
      ["2026-11-13", "Vinseva", "Professional app issues", "2 and half", "In Progress", "Build is failing", ["Police verification certificate", "FAQ issue", "Terms in login screen"]],
      ["2026-11-13", "Vinseva", "Restaurant app issues", "2 and half", "", "", ["Terms and conditions not showing", "Auto logout", "Police verification certificate"]],
      ["2026-11-17", "Vinseva", "All three apps — restaurant and professional issues", "17-11-2026 afternoon", "", "", ["Restaurant: terms and conditions not showing", "Restaurant: police verification certificate", "Professional: police verification certificate", "Professional: FAQ issue", "Professional: terms in login screen"]],
      ["2026-11-17", "Vinseva", "User issue", "", "Completed", ""],
    ],
  },
  {
    name: "Yashwanth", techStack: "Flutter", device: "Dell, Tecno phone", specs: "i5, 16GB RAM", issue: "Hanging even when changing tabs", availableFrom: "2026-11-13",
    projects: [
      ["Howpa", "Flutter", "2026-10-25", "Ongoing", "Low", "Not working currently (testing pending)", 80],
      ["Waiting App", "Flutter", "2026-07-31", "On Hold", "Medium", "No response from client; deadline needs revision. User app / sub-admin pending"],
      ["Visakha Valley", "Flutter", "2026-07-31", "Ongoing", "High", "Making changes on add-ons (client is checking)", 90],
      ["Vizag Chambers", "Flutter", "2026-07-29", "On Hold", "High", "Client not responding"],
      ["Sri Kyshap School", "Flutter", "2027-01-25", "On Hold", "Medium", "Payment integration completed, only SMS pending. Once client confirms we need to make live (need Play Store details from client)", 100],
      ["TaxClick", "Flutter", "2026-10-15", "On Hold", "Medium", "Once client confirms we can make live — client side delay", 100],
      ["Gully Deals", "Flutter", "", "Upcoming", "Medium", "Need to check with BD"],
      ["My Town News", "Flutter", "2026-08-31", "On Hold", "Low", "New add-ons in progress, client not responding", 100],
      ["Rockyrobo", "Flutter", "", "Ongoing", "Low", "Need to convert the website to a Flutter app"],
      ["Legends Food", "Flutter", "", "Upcoming", "", "Need to start the clone"],
    ],
    daily: [
      ["2026-11-12", "Visakha Valley", "Teacher app and parent app fixes", "eod", "In Progress", "", ["Teacher app announcements", "Class diary", "Gallery images and video issues fixing", "Parent app testing and fix the issues"]],
      ["2026-11-12", "Howpa", "Fix any bugs", "", "", ""],
      ["2026-11-13", "Rockyrobo", "Convert the website to Flutter app", "eod", "In Progress", ""],
      ["2026-11-16", "Vooket", "Issues to fix", "", "", ""],
      ["2026-11-16", "Visakha Valley", "Class diary multiple uploads", "", "", ""],
      ["2026-11-16", "MaxWill", "iOS live", "", "", ""],
      ["2026-11-17", "Legends Food", "Clone", "2 days", "", ""],
      ["2026-11-17", "Granate World", "Support", "", "", ""],
    ],
  },
  {
    name: "Saleem Sir", techStack: "Flutter", device: "Dell, Realme", specs: "i5, 8GB RAM", availableFrom: "2026-10-30",
    projects: [
      ["Visakha Valley", "Flutter", "", "Completed", "Medium", ""],
      ["Nakshatra", "Flutter", "2026-09-15", "Completed", "Medium", "On 08 Sep we need to upload the APK"],
      ["GTM for Zospin", "Flutter", "2026-08-26", "Completed", "High", "Uploaded in iOS"],
      ["MaxWill", "Flutter", "2026-09-15", "On Hold", "Low", "Client confirms, then we can make it live"],
      ["Ziffy Pro", "Flutter", "2026-10-09", "Ongoing", "Medium", "Need to test the functionalities"],
      ["Dr Wound", "Flutter", "", "Completed", "Medium", ""],
      ["My Town News", "Flutter", "", "Completed", "Medium", "Need to do iOS"],
      ["Krishned", "Flutter", "", "Ongoing", "Medium", "Need to do iOS"],
      ["Vooket", "Flutter", "", "Ongoing", "Medium", "Client changes pending"],
    ],
    daily: [
      ["2026-11-12", "Krishned", "Client-reported issues fixing", "?", "Completed", "All done except the screenshot and screen-record disable option (done)"],
      ["2026-11-13", "Vooket", "User app running — delivery partner issues", "eod", "", "", ["Online order completion: delivery partner can't complete the online order from their side", "Delivery partner privacy policy is not displayed", "Order list doesn't scroll to the bottom, so the last orders can't be seen"]],
    ],
  },
  {
    name: "Chandu (Intern)", techStack: "Flutter", device: "Dell, Motorola G4", specs: "i5, 8GB RAM", issue: "Laptop is very slow, can't build APKs", availableFrom: "2026-11-16",
    projects: [
      ["Howpa", "Flutter", "2026-10-25", "Ongoing", "Medium", "Doctor app completed, pharmacy started (testing pending)", 80, "Doctor App"],
    ],
    daily: [
      ["2026-11-12", "Howpa", "Pharmacy testing modules", "eod", "Completed", "", ["Locations API not working", "Medicines test case"]],
      ["2026-11-13", "Howpa", "Testing yesterday's changes", "eod", "In Progress", ""],
      ["2026-11-16", "Howpa", "Give final APKs", "", "", ""],
      ["2026-11-17", "Howpa", "Solve some issues", "", "", ""],
    ],
  },
  {
    name: "Santosh G", techStack: "Web Designer", device: "Dell", specs: "i5, 16GB RAM", availableFrom: "2026-10-20",
    projects: [
      ["Canny Trip", "Web designer", "2026-07-31", "Completed", "High", "Payment pending"],
      ["The Placement Maker", "Web designer", "2026-08-31", "On Hold", "High", "Client side delay — client needs to confirm. Client responded on 10-09-2026 and gave inner page changes to work on"],
      ["GVP Tax", "Web designer", "2026-09-15", "Completed", "High", "Inner pages completed. Client needs to confirm"],
      ["OmegaGroupLTD", "Inner pages", "2026-09-15", "Completed", "Medium", "Pending for live client approval"],
      ["SafeEnviron", "Change", "", "Completed", "High", ""],
      ["SSS Enterprises", "BackEnd", "2026-07-23", "Completed", "Medium", "Need to test the progress"],
      ["The Holiday Boy", "Web designer", "2026-09-02", "Completed", "High", "Live completed"],
      ["Acclimate", "Web designer", "2026-07-31", "Completed", "High", "Need client side approval"],
      ["VB Group", "Web designer", "2026-07-30", "Completed", "High", "Live completed"],
      ["Digitweets", "Web designer", "", "Ongoing", "Medium", ""],
      ["Jyothiyalaam", "Web designer", "2026-10-15", "Ongoing", "High", "Sri Jyothiyalam website: received approval yesterday. Need to design inner pages"],
      ["VBCL", "Web designer", "", "Ongoing", "Medium", "Mock-up screens will be delivered by today EOD"],
      ["Zenvy", "Web designer", "2027-01-31", "Upcoming", "Medium", "Yet to start"],
      ["Palm Beach", "Web designer", "2026-10-15", "Ongoing", "Medium", "Inner pages and home pages completed. If approved we can proceed with dynamic. Client side pending images"],
      ["Suviro", "Web designer", "2026-10-15", "Upcoming", "Medium", "Yet to start"],
      ["Kalapavalli", "Web designer", "2026-08-31", "Completed", "High", "Live completed"],
      ["ARP Infra Solutions", "Web designer", "2026-08-31", "Completed", "High", "Working on it"],
    ],
    daily: [
      ["2026-11-12", "Callme", "New home page", "5 hours", "Completed", ""],
      ["2026-11-12", "MaxWill", "Play Store screens design", "1 and half", "In Progress", "Didn't get screens and content from Asha"],
      ["2026-11-13", "Suviro", "Removal of contents", "30 mins", "", ""],
      ["2026-11-13", "Cmoon", "Certificates", "", "", ""],
      ["2026-11-13", "MaxWill", "App Store screens", "1 and half", "", ""],
    ],
  },
  {
    name: "J Gnaneswar", techStack: "Node & PHP", availableFrom: "2026-10-15",
    projects: [
      ["hellomatrimony.org (Ready Made)", "Node & PHP", "", "On Hold", "Medium", "Support work"],
      ["B2B Connect Mobile App", "Node & PHP", "", "Ongoing", "Medium", "Delivered the fixes on Tuesday. Waiting for client update"],
      ["Vooket", "Node & PHP", "", "On Hold", "Medium", "Amount release bugs fix chestharu annaru"],
      ["Vinseva.in", "Node & PHP", "", "Completed", "Medium", "Live completed. Waiting for client response"],
      ["Speedy Serve (Bus Booking App)", "Node & PHP", "", "Ongoing", "Medium", "Third-party API documentation pending. Client side delay — API not purchased"],
      ["SM Communications", "Node & PHP", "", "On Hold", "Medium", "Present no work"],
      ["Vehicle QR Scanner", "Node & PHP", "", "On Hold", "Medium", "Present no work"],
      ["Runbro", "Node & PHP", "", "Ongoing", "Medium", "Issue fixed. If any issue comes up we need to fix it. As of now no work"],
      ["Nakshatra", "Node & PHP", "", "Completed", "Medium", "Support. No work on backend side"],
      ["Infinity Delivery", "Node & PHP", "", "Completed", "", "Handled by Raju sir"],
      ["Zospin", "Node & PHP", "", "Completed", "High", "Need to work on vendor panel"],
      ["Ziffy Pro", "Node & PHP", "", "Ongoing", "High", "Working on admin panel"],
      ["Willcart", "Node & PHP", "", "On Hold", "", "Present no work"],
    ],
    daily: [],
  },
  {
    name: "Santosh G (FrontEnd)", techStack: "FrontEnd",
    projects: [
      ["SriSatyanarayanaNursery.in", "FrontEnd", "", "", "", ""],
      ["SproutGrowthHeaven.in", "FrontEnd", "", "", "", ""],
    ],
    daily: [],
  },
  {
    name: "Santosh Tester", techStack: "Tester",
    projects: [
      ["Go Andhra", "Tester", "", "Ongoing", "Medium", "We will provide the demo to client by Monday"],
      ["UBHI", "Tester", "", "Ongoing", "High", "Will be completed by Thursday"],
      ["RhockDeal", "Tester", "", "Completed", "Medium", ""],
      ["Hotel Jas", "Tester", "2026-09-15", "Ongoing", "High", "Went to client location for demo"],
    ],
    daily: [
      ["2026-11-16", "Howpa", "Testing", "eod", "", ""],
    ],
  },
  {
    name: "Ramesh", techStack: "Tester",
    projects: [
      ["MEPSTOCK", "Tester", "", "Ongoing", "High", ""],
      ["MHH", "Tester", "", "Upcoming", "High", "Yet to start"],
      ["Speedy Serve (Bus Booking App)", "Tester", "", "Ongoing", "Medium", ""],
      ["Dr Wound", "Tester", "", "Ongoing", "Low", "Need to test once we get the devices"],
    ],
    daily: [],
  },
];
