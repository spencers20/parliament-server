export const billStages = [
  {
    // bill: billId,
    index: 1,
    name: "Introduction",
    status: "current",
    actions: [
      {
        index: 1,
        name: "Senator proposes bill",
        responsibility: "senator",
        status: "complete",
      },
      {
        index: 2,
        name: "Clerk forwards bill to DLS",
        responsibility: "clerk",
        status: "current",
      },
    ],
  },

  {
     // bill: billId,
    index: 2,
    name: "Draft Preparation",
    status: "pending",
    actions: [
      // {
      //   index: 1,
      //   name: "DLS downloads bill",
      //   responsibility: "dls",
      //   status: "pending",
      // },
      {
        index: 1,
        name: "DLS uploads new draft",
        responsibility: "dls",
        status: "pending",
      },
      {
        index: 2,
        name: "Sponsor signs draft",
        responsibility: "senator",
        status: "pending",
      },
      {
        index: 3,
        name: "Clerk comments on draft",
        responsibility: "clerk",
        status: "pending",
      },
      {
        index: 4,
        name: "Speaker approves pre-publication scrutiny",
        responsibility: "speaker",
        status: "pending",
      },
    ],
  },

  {
     // bill: billId,
    index: 3,
    name: "Pre-publication Scrutiny",
    status: "pending",
    actions: [
      {
        index: 1,
        name: "Committee uploads scrutiny report",
        responsibility: "committee",
        status: "pending",
      },
      {
        index: 2,
        name: "Speaker approves publication",
        responsibility: "speaker",
        status: "pending",
      },
    ],
  },

  {
     // bill: billId,
    index: 4,
    name: "Publication",
    status: "pending",
    actions: [
      {
        index: 1,
        name: "Bill to be published, given bill number and printed blue",
        responsibility: "clerk",
        status: "pending",
      },
    ],
  },

  {
     // bill: billId,
    index: 5,
    name: "Waiting Period",
    status: "pending",
    actions: [
      {
        index: 1,
        name: "Bill given time to mature",
        responsibility: "clerk",
        status: "pending",
      },
    ],
  },

  {
     // bill: billId,
    index: 6,
    name: "First Reading",
    status: "pending",
    actions: [
      {
        index: 1,
        name: "Clerk reads bill",
        responsibility: "clerk",
        status: "pending",
      },
      {
        index: 2,
        name: "Speaker assigns review committee",
        responsibility: "speaker",
        status: "pending",
      },
    ],
  },

  {
     // bill: billId,
    index: 7,
    name: "Committee Scrutiny",
    status: "pending",
    actions: [
      {
        index: 1,
        name: "Committee carries out deep scrutiny from public and stakeholders",
        responsibility: "committee",
        status: "pending",
      },
      {
        index: 2,
        name: "Committee reads report",
        responsibility: "committee",
        status: "pending",
      },
    ],
  },

  {
     // bill: billId,
    index: 8,
    name: "Second Reading",
    status: "pending",
    actions: [
      {
        index: 1,
        name: "Clerk places bill on order paper",
        responsibility: "clerk",
        status: "pending",
      },
      {
        index: 2,
        name: "Speaker opens voting",
        responsibility: "speaker",
        status: "pending",
      },
      {
        index: 3,
        name: "Speaker closes voting",
        responsibility: "speaker",
        status: "pending",
      },
      // {
      //   index: 4,
      //   name: "Clerk uploads second reading minutes",
      //   responsibility: "clerk",
      //   status: "pending",
      // },
    ],
  },

  {
     // bill: billId,
    index: 9,
    name: "Amendment Proposal",
    status: "pending",
    actions: [
      {
        index: 1,
        name: "Senator proposes amendment",
        responsibility: "senator",
        status: "pending",
      },
    ],
  },

  {
     // bill: billId,
    index: 10,
    name: "Committee Stage",
    status: "pending",
    actions: [
      {
        index: 1,
        name: "The house debates and votes on ammendments and clauses together as a committee",
        responsibility: "clerk",
        status: "pending",
      },
    ],
  },

  {
     // bill: billId,
    index: 11,
    name: "Report Stage",
    status: "pending",
    actions: [
      {
        index: 1,
        name: "Clerk places report stage on order paper",
        responsibility: "clerk",
        status: "pending",
      },
      {
        index: 2,
        name: "Speaker opens voting",
        responsibility: "speaker",
        status: "pending",
      },
      {
        index: 3,
        name: "Speaker closes voting",
        responsibility: "speaker",
        status: "pending",
      },
    ],
  },

  {
     // bill: billId,
    index: 12,
    name: "Reprinting",
    status: "pending",
    actions: [
      {
        index: 1,
        name: "DLS incorporates amendments",
        responsibility: "dls",
        status: "pending",
      },
    ],
  },

  {
     // bill: billId,
    index: 13,
    name: "Third Reading",
    status: "pending",
    actions: [
      {
        index: 1,
        name: "Clerk places bill on order paper",
        responsibility: "clerk",
        status: "pending",
      },
      {
        index: 2,
        name: "Speaker initiates voting",
        responsibility: "speaker",
        status: "pending",
      },
      {
        index: 3,
        name: "Speaker closes voting",
        responsibility: "speaker",
        status: "pending",
      },
    ],
  },
];