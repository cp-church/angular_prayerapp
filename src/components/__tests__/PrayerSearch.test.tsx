import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PrayerSearch } from "../PrayerSearch";

/**
 * Replace the ad-hoc builder-style mock with the shared, chainable
 * `createSupabaseMock` factory. Tests call `setMockPrayerData` to update
 * the in-memory table used by the mock; the mock also exposes a
 * `__testData` field so tests can inspect/replace it directly.
 */

let mockPrayerData: any[] = [];

/*
  Create the supabase mock inside a vi.mock factory so Vitest's hoisting
  does not cause initialization-order ReferenceErrors. The factory
  will synchronously create a fresh mock and named helpers for modules
  that import them.
*/
vi.mock("../../lib/supabase", async () => {
  const mod = await import("../../testUtils/supabaseMock");
  const createSupabaseMock =
    (mod as any).default ?? (mod as any).createSupabaseMock;
  const supabaseMock = createSupabaseMock({
    fromData: { prayers: [] },
    functionsInvoke: async () => ({ data: null, error: null }),
  }) as any;

  // Initialize the internal table data. Tests will update this via setMockPrayerData.
  supabaseMock.__testData.prayers = [];

  const mockDirectQuery = vi.fn();
  const mockDirectMutation = vi.fn();

  return {
    supabase: supabaseMock,
    directQuery: mockDirectQuery,
    directMutation: mockDirectMutation,
  } as any;
});

// Import the mocked module used by the application code.
import { supabase } from "../../lib/supabase";

// Helper to update test data and the global fetch mock (some code uses both)
const setMockPrayerData = (data: any[]) => {
  mockPrayerData = data;
  (supabase as any).__testData.prayers = mockPrayerData;

  // Keep the fetch mock compatible with code paths that call the REST endpoint.
  global.fetch = vi.fn().mockImplementation((url: string) => {
    let filteredData = [...mockPrayerData];

    // Try to parse query params and apply simple filters used by the component.
    try {
      const urlObj = new URL(url);
      const statusParam = urlObj.searchParams.get("status");
      const approvalParam = urlObj.searchParams.get("approval_status");

      if (statusParam && statusParam.startsWith("eq.")) {
        const val = statusParam.replace("eq.", "");
        filteredData = filteredData.filter((p) => p.status === val);
      }
      if (approvalParam && approvalParam.startsWith("eq.")) {
        const val = approvalParam.replace("eq.", "");
        filteredData = filteredData.filter((p) => p.approval_status === val);
      }
    } catch (e) {
      // ignore URL parsing failures in tests
    }

    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(filteredData),
    });
  });
};

describe("PrayerSearch Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default to empty data
    setMockPrayerData([]);

    // Safe defaults for browser APIs used by the component
    // @ts-ignore
    global.confirm = vi.fn(() => true);
  });

  it("renders the search component with header and input", () => {
    render(<PrayerSearch />);
    expect(
      screen.getByRole("heading", { name: /prayer editor/i }),
    ).toBeDefined();
    expect(
      screen.getByPlaceholderText(
        /Search by title, requester, email, description, or denial reasons/i,
      ),
    ).toBeDefined();
    const searchButton = screen.getByRole("button", { name: /^search$/i });
    expect(searchButton).toBeDefined();
  });

  it("allows typing in the search input", async () => {
    const user = userEvent.setup();
    render(<PrayerSearch />);
    const searchInput = screen.getByPlaceholderText(
      /Search by title, requester, email, description, or denial reasons/i,
    ) as HTMLInputElement;
    await user.type(searchInput, "John");
    expect(searchInput.value).toBe("John");
  });

  it("performs search and displays results from supabase mock", async () => {
    const user = userEvent.setup();
    const mockPrayers = [
      {
        id: "1",
        title: "Test Prayer",
        requester: "John Doe",
        email: "john@example.com",
        status: "current",
        approval_status: "approved",
        created_at: "2025-01-01T00:00:00Z",
        prayer_updates: [],
      },
    ];

    setMockPrayerData(mockPrayers);
    render(<PrayerSearch />);

    const searchInput = screen.getByPlaceholderText(
      /Search by title, requester, email, description, or denial reasons/i,
    );
    const searchButton = screen.getByRole("button", { name: /^search$/i });

    await user.type(searchInput, "John");
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText("Test Prayer")).toBeDefined();
      expect(screen.getByText(/John Doe/)).toBeDefined();
    });
  });

  it("performs search on Enter key and shows single result", async () => {
    const user = userEvent.setup();
    const mockPrayers = [
      {
        id: "1",
        title: "Test Prayer",
        requester: "John Doe",
        email: "john@example.com",
        status: "current",
        approval_status: "approved",
        created_at: "2025-01-01T00:00:00Z",
        prayer_updates: [],
      },
    ];

    setMockPrayerData(mockPrayers);
    render(<PrayerSearch />);
    const searchInput = screen.getByPlaceholderText(
      /Search by title, requester, email, description, or denial reasons/i,
    );
    await user.type(searchInput, "John{Enter}");

    await waitFor(() => {
      expect(screen.getByText("Test Prayer")).toBeDefined();
    });
  });

  it('displays "no prayers found" message when search returns empty', async () => {
    const user = userEvent.setup();
    setMockPrayerData([]);
    render(<PrayerSearch />);
    const searchInput = screen.getByPlaceholderText(
      /Search by title, requester, email, description, or denial reasons/i,
    );
    const searchButton = screen.getByRole("button", { name: /^search$/i });
    await user.type(searchInput, "NonexistentUser");
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText(/no prayers found/i)).toBeDefined();
    });
  });

  it("clears search when clear button clicked", async () => {
    const user = userEvent.setup();
    render(<PrayerSearch />);
    const input = screen.getByPlaceholderText(
      /Search by title, requester, email, description, or denial reasons/i
    ) as HTMLInputElement;
    await user.type(input, "test");
    const clear = input.parentElement?.querySelector('button');
    if (clear) await user.click(clear);
    expect(input.value).toBe("");
  });

  it("filters by status - current", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{id:"1",title:"Current Prayer",requester:"John",email:"j@t.com",status:"current",approval_status:"approved",created_at:"2025-01-01T00:00:00Z",prayer_updates:[]}]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "current");
    await waitFor(() => expect(screen.getByText("Current Prayer")).toBeDefined());
  });

  it("filters by status - answered", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{id:"1",title:"Answered Prayer",requester:"Jane",email:"j@t.com",status:"answered",approval_status:"approved",created_at:"2025-01-01T00:00:00Z",prayer_updates:[]}]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "answered");
    await waitFor(() => expect(screen.getByText("Answered Prayer")).toBeDefined());
  });

  it("filters by status - archived", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{id:"1",title:"Archived Prayer",requester:"Bob",email:"b@t.com",status:"archived",approval_status:"approved",created_at:"2025-01-01T00:00:00Z",prayer_updates:[]}]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "archived");
    await waitFor(() => expect(screen.getByText("Archived Prayer")).toBeDefined());
  });

  it("expands prayer to show details", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{id:"1",title:"Test",requester:"John",email:"j@t.com",status:"current",approval_status:"approved",description:"Details here",created_at:"2025-01-01T00:00:00Z",prayer_updates:[]}]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test")).toBeDefined());
    await user.click(screen.getByText("Test"));
    await waitFor(() => expect(screen.getByText("Details here")).toBeDefined());
  });

  it("shows prayer updates", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{id:"1",title:"Test",requester:"John",email:"j@t.com",status:"current",approval_status:"approved",created_at:"2025-01-01T00:00:00Z",prayer_updates:[{id:"u1",content:"Update 1",author:"Author",created_at:"2025-01-02T00:00:00Z",approval_status:"approved"}]}]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test")).toBeDefined());
    await user.click(screen.getByText("Test"));
    await waitFor(() => expect(screen.getByText("Update 1")).toBeDefined());
  });

  it("shows denial reason badge", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{id:"1",title:"Test",requester:"John",email:"j@t.com",status:"current",approval_status:"denied",denial_reason:"Reason",created_at:"2025-01-01T00:00:00Z",prayer_updates:[]}]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText(/has denial/i)).toBeDefined());
  });

  it("opens edit form", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{id:"1",title:"Test",requester:"John",email:"j@t.com",status:"current",approval_status:"approved",description:"Desc",created_at:"2025-01-01T00:00:00Z",prayer_updates:[]}]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test")).toBeDefined());
    await user.click(screen.getByTitle(/edit this prayer/i));
    await waitFor(() => expect(screen.getByDisplayValue("Test")).toBeDefined());
  });

  it("shows edit form cancel button", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{id:"1",title:"Test",requester:"John",email:"j@t.com",status:"current",approval_status:"approved",description:"Desc",created_at:"2025-01-01T00:00:00Z",prayer_updates:[]}]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test")).toBeDefined());
    await user.click(screen.getByTitle(/edit this prayer/i));
    await waitFor(() => expect(screen.getByRole("button", {name:/cancel/i})).toBeDefined());
  });

  it("shows add update button", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{id:"1",title:"Test",requester:"John",email:"j@t.com",status:"current",approval_status:"approved",created_at:"2025-01-01T00:00:00Z",prayer_updates:[]}]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test")).toBeDefined());
    await user.click(screen.getByText("Test"));
    await waitFor(() => expect(screen.getByRole("button", {name:/add update/i})).toBeDefined());
  });

  it("opens add update form", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{id:"1",title:"Test",requester:"John",email:"j@t.com",status:"current",approval_status:"approved",created_at:"2025-01-01T00:00:00Z",prayer_updates:[]}]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test")).toBeDefined());
    await user.click(screen.getByText("Test"));
    await user.click(screen.getByRole("button", {name:/add update/i}));
    await waitFor(() => expect(screen.getByPlaceholderText(/enter the update content/i)).toBeDefined());
  });

  it("displays warning message", () => {
    render(<PrayerSearch />);
    expect(screen.getByText(/warning:/i)).toBeDefined();
    expect(screen.getByText(/deleting prayers is permanent/i)).toBeDefined();
  });

  it("displays empty state", () => {
    render(<PrayerSearch />);
    expect(screen.getByText(/search prayers & audit log/i)).toBeDefined();
  });

  it("renders multiple prayers", async () => {
    const user = userEvent.setup();
    setMockPrayerData([
      {id:"1",title:"Prayer 1",requester:"John",email:"j@t.com",status:"current",approval_status:"approved",created_at:"2025-01-01T00:00:00Z",prayer_updates:[]},
      {id:"2",title:"Prayer 2",requester:"Jane",email:"jane@t.com",status:"current",approval_status:"approved",created_at:"2025-01-02T00:00:00Z",prayer_updates:[]},
      {id:"3",title:"Prayer 3",requester:"Bob",email:"b@t.com",status:"current",approval_status:"approved",created_at:"2025-01-03T00:00:00Z",prayer_updates:[]}
    ]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => {
      expect(screen.getByText("Prayer 1")).toBeDefined();
      expect(screen.getByText("Prayer 2")).toBeDefined();
      expect(screen.getByText("Prayer 3")).toBeDefined();
    });
  });

  it("shows checkboxes", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{id:"1",title:"Test",requester:"John",email:"j@t.com",status:"current",approval_status:"approved",created_at:"2025-01-01T00:00:00Z",prayer_updates:[]}]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0));
  });

  it("shows edit and delete buttons", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{id:"1",title:"Test",requester:"John",email:"j@t.com",status:"current",approval_status:"approved",created_at:"2025-01-01T00:00:00Z",prayer_updates:[]}]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => {
      expect(screen.getByTitle(/edit this prayer/i)).toBeDefined();
      expect(screen.getByTitle(/delete this prayer/i)).toBeDefined();
    });
  });

  it("displays prayer created date", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{id:"1",title:"Test",requester:"John",email:"j@t.com",status:"current",approval_status:"approved",created_at:"2025-01-01T00:00:00Z",prayer_updates:[]}]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText(/created:/i)).toBeDefined());
  });

  it("displays update with denied approval status", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test Prayer",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[{
        id:"u1",
        content:"Test update",
        author:"Jane",
        created_at:"2025-01-02T00:00:00Z",
        approval_status:"denied",
        denial_reason:null
      }]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test Prayer")).toBeDefined());
    await user.click(screen.getByText("Test Prayer"));
    await waitFor(() => {
      expect(screen.getByText("Test update")).toBeDefined();
      const deniedBadges = screen.getAllByText(/denied/i);
      expect(deniedBadges.length).toBeGreaterThan(0);
    });
  });

  it("displays update with pending approval status", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test Prayer",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[{
        id:"u1",
        content:"Pending update",
        author:"Jane",
        created_at:"2025-01-02T00:00:00Z",
        approval_status:"pending",
        denial_reason:null
      }]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test Prayer")).toBeDefined());
    await user.click(screen.getByText("Test Prayer"));
    await waitFor(() => {
      expect(screen.getByText("Pending update")).toBeDefined();
      const pendingBadges = screen.getAllByText(/pending/i);
      expect(pendingBadges.length).toBeGreaterThan(0);
    });
  });

  it("displays update with denial reason section", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test Prayer",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[{
        id:"u1",
        content:"Test update",
        author:"Jane",
        created_at:"2025-01-02T00:00:00Z",
        approval_status:"denied",
        denial_reason:"Content inappropriate"
      }]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test Prayer")).toBeDefined());
    await user.click(screen.getByText("Test Prayer"));
    await waitFor(() => {
      expect(screen.getByText("Content inappropriate")).toBeDefined();
      expect(screen.getByText(/denial reason:/i)).toBeDefined();
    });
  });

  it("displays delete button for updates", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test Prayer",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[{
        id:"u1",
        content:"Update with delete",
        author:"Jane",
        created_at:"2025-01-02T00:00:00Z",
        approval_status:"approved"
      }]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test Prayer")).toBeDefined());
    await user.click(screen.getByText("Test Prayer"));
    await waitFor(() => {
      const deleteButtons = screen.getAllByTitle(/delete this update/i);
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });

  it("displays prayer_for field when present", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      prayer_for:"Jane Doe",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test")).toBeDefined());
    await user.click(screen.getByText("Test"));
    await waitFor(() => {
      expect(screen.getByText(/praying for:/i)).toBeDefined();
      expect(screen.getByText("Jane Doe")).toBeDefined();
    });
  });

  it("displays email in compact header", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test",
      requester:"John Doe",
      email:"john.doe@example.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => {
      expect(screen.getByText("john.doe@example.com")).toBeDefined();
    });
  });

  it("displays update author name", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test Prayer",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[{
        id:"u1",
        content:"Update content",
        author:"Jane Smith",
        created_at:"2025-01-02T00:00:00Z",
        approval_status:"approved"
      }]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test Prayer")).toBeDefined());
    await user.click(screen.getByText("Test Prayer"));
    await waitFor(() => {
      expect(screen.getByText(/by:/i)).toBeDefined();
      expect(screen.getByText("Jane Smith")).toBeDefined();
    });
  });

  it("displays multiple updates in order", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test Prayer",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[
        {
          id:"u1",
          content:"First update",
          author:"Author 1",
          created_at:"2025-01-02T00:00:00Z",
          approval_status:"approved"
        },
        {
          id:"u2",
          content:"Second update",
          author:"Author 2",
          created_at:"2025-01-03T00:00:00Z",
          approval_status:"approved"
        }
      ]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test Prayer")).toBeDefined());
    await user.click(screen.getByText("Test Prayer"));
    await waitFor(() => {
      expect(screen.getByText("First update")).toBeDefined();
      expect(screen.getByText("Second update")).toBeDefined();
      expect(screen.getByText(/prayer updates \(2\)/i)).toBeDefined();
    });
  });

  it("displays update created date", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test Prayer",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[{
        id:"u1",
        content:"Update",
        author:"Jane",
        created_at:"2025-01-15T00:00:00Z",
        approval_status:"approved"
      }]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test Prayer")).toBeDefined());
    await user.click(screen.getByText("Test Prayer"));
    await waitFor(() => {
      expect(screen.getByText("Update")).toBeDefined();
      // Check for date display - should show 1/15/2025 or similar
      const dateElements = screen.getAllByText(/1\/15\/2025/i);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });

  it("displays no prayers found message", async () => {
    const user = userEvent.setup();
    setMockPrayerData([]);
    render(<PrayerSearch />);
    const searchInput = screen.getByPlaceholderText(
      /Search by title, requester, email, description, or denial reasons/i
    );
    await user.type(searchInput, "nonexistent");
    await user.click(screen.getByRole("button", { name: /^search$/i }));
    await waitFor(() => {
      expect(screen.getByText(/no prayers found/i)).toBeDefined();
    });
  });

  it("displays prayer with pending approval status in expanded view", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Pending Prayer",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"pending",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Pending Prayer")).toBeDefined());
    await user.click(screen.getByText("Pending Prayer"));
    await waitFor(() => {
      expect(screen.getByText(/approval status:/i)).toBeDefined();
      const pendingBadges = screen.getAllByText(/pending/i);
      expect(pendingBadges.length).toBeGreaterThan(0);
    });
  });



  it("displays approval status badge for approved prayer in expanded view", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Approved Prayer",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Approved Prayer")).toBeDefined());
    await user.click(screen.getByText("Approved Prayer"));
    await waitFor(() => {
      expect(screen.getByText(/approval status:/i)).toBeDefined();
      const approvedBadges = screen.getAllByText(/approved/i);
      expect(approvedBadges.length).toBeGreaterThan(0);
    });
  });

  it("displays approval status badge for denied prayer in expanded view", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Denied Prayer",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"denied",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Denied Prayer")).toBeDefined());
    await user.click(screen.getByText("Denied Prayer"));
    await waitFor(() => {
      expect(screen.getByText(/approval status:/i)).toBeDefined();
      const deniedBadges = screen.getAllByText(/denied/i);
      expect(deniedBadges.length).toBeGreaterThan(0);
    });
  });
});
