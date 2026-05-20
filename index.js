/**
 * UNIDESK | Aethercore Interactive
 * Live Exam Updates Database & Core Configuration
 */

const examsData = [
    {
        title: "BEL Recruitment 2026",
        description: "Apply Online for 56 Field Operation Engineer, Project Engineer Posts",
        category: "PSU",
        date: "20 May 2026"
    },
    {
        title: "NALCO Non Executive Recruitment 2026",
        description: "Apply Online for 268 Various Posts",
        category: "PSU",
        date: "18 May 2026"
    },
    {
        title: "NTPC EET Recruitment 2026",
        description: "Through GATE 2025 (52 Posts) Online Form, Notification",
        category: "PSU",
        date: "18 May 2026"
    }
];

// Exporting data cleanly in case you scale up to modern modules later
if (typeof module !== 'undefined' && module.exports) {
    module.exports = examsData;
}
