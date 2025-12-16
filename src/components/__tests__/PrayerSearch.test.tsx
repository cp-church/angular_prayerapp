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

  it("shows select all checkbox label with count", async () => {
    const user = userEvent.setup();
    setMockPrayerData([
      {id:"1",title:"Prayer 1",requester:"John",email:"j@t.com",status:"current",approval_status:"approved",created_at:"2025-01-01T00:00:00Z",prayer_updates:[]},
      {id:"2",title:"Prayer 2",requester:"Jane",email:"jane@t.com",status:"current",approval_status:"approved",created_at:"2025-01-02T00:00:00Z",prayer_updates:[]}
    ]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => {
      expect(screen.getByText(/select all \(2\)/i)).toBeDefined();
    });
  });

  it("toggles individual prayer selection", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test Prayer",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test Prayer")).toBeDefined());
    
    const checkboxes = screen.getAllByRole('checkbox');
    const prayerCheckbox = checkboxes.find(cb => cb !== checkboxes[0]);
    if (prayerCheckbox) {
      await user.click(prayerCheckbox);
      await waitFor(() => {
        expect(screen.getByText(/1 selected/i)).toBeDefined();
      });
    }
  });

  it("shows bulk action buttons when prayers selected", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test Prayer",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test Prayer")).toBeDefined());
    
    const checkboxes = screen.getAllByRole('checkbox');
    const prayerCheckbox = checkboxes.find(cb => cb !== checkboxes[0]);
    if (prayerCheckbox) {
      await user.click(prayerCheckbox);
      await waitFor(() => {
        expect(screen.getByText(/change status:/i)).toBeDefined();
      });
    }
  });

  it("displays bulk status dropdown options", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test Prayer",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test Prayer")).toBeDefined());
    
    const checkboxes = screen.getAllByRole('checkbox');
    const selectAllCb = checkboxes[0];
    await user.click(selectAllCb);
    
    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(2);
    });
  });

  it("cancels edit when cancel button clicked", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test Prayer",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      description:"Test desc",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test Prayer")).toBeDefined());
    
    const editBtn = screen.getByTitle(/edit this prayer/i);
    await user.click(editBtn);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Prayer")).toBeDefined();
    });
    
    const cancelBtn = screen.getByRole("button", {name: /cancel/i});
    await user.click(cancelBtn);
    
    await waitFor(() => {
      expect(screen.queryByDisplayValue("Test Prayer")).toBeNull();
    });
  });

  it("cancels add update when cancel clicked", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test Prayer",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test Prayer")).toBeDefined());
    
    await user.click(screen.getByText("Test Prayer"));
    
    await waitFor(() => {
      const addUpdateBtn = screen.getByRole("button", {name: /add update/i});
      expect(addUpdateBtn).toBeDefined();
    });
    
    await user.click(screen.getByRole("button", {name: /add update/i}));
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter the update content/i)).toBeDefined();
    });
    
    const cancelBtns = screen.getAllByRole("button", {name: /cancel/i});
    await user.click(cancelBtns[0]);
    
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/enter the update content/i)).toBeNull();
    });
  });

  it("displays basic information section in expanded view", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test Prayer",
      requester:"John Doe",
      email:"john@example.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test Prayer")).toBeDefined());
    
    await user.click(screen.getByText("Test Prayer"));
    
    await waitFor(() => {
      expect(screen.getByText(/basic information/i)).toBeDefined();
      expect(screen.getByText(/status information/i)).toBeDefined();
    });
  });

  it("displays requester in expanded view", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test Prayer",
      requester:"John Doe",
      email:"john@example.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test Prayer")).toBeDefined());
    
    await user.click(screen.getByText("Test Prayer"));
    
    await waitFor(() => {
      const requesterElements = screen.getAllByText(/john doe/i);
      expect(requesterElements.length).toBeGreaterThan(0);
    });
  });

  it("displays email in expanded view when present", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test Prayer",
      requester:"John Doe",
      email:"john@example.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test Prayer")).toBeDefined());
    
    await user.click(screen.getByText("Test Prayer"));
    
    await waitFor(() => {
      const emailElements = screen.getAllByText(/john@example.com/i);
      expect(emailElements.length).toBeGreaterThan(0);
    });
  });

  it("displays title in expanded view", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Special Prayer Request",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Special Prayer Request")).toBeDefined());
    
    await user.click(screen.getByText("Special Prayer Request"));
    
    await waitFor(() => {
      const titleElements = screen.getAllByText(/special prayer request/i);
      expect(titleElements.length).toBeGreaterThan(0);
    });
  });

  it("displays prayer status in expanded view", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test Prayer",
      requester:"John",
      email:"j@t.com",
      status:"answered",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test Prayer")).toBeDefined());
    
    await user.click(screen.getByText("Test Prayer"));
    
    await waitFor(() => {
      expect(screen.getByText(/prayer status:/i)).toBeDefined();
      const answeredBadges = screen.getAllByText(/answered/i);
      expect(answeredBadges.length).toBeGreaterThan(0);
    });
  });

  it("expands and shows complete prayer details", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Complete Prayer",
      requester:"John Doe",
      email:"john@example.com",
      status:"current",
      approval_status:"approved",
      prayer_for:"Jane",
      description:"Full description",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Complete Prayer")).toBeDefined());
    
    await user.click(screen.getByText("Complete Prayer"));
    
    await waitFor(() => {
      expect(screen.getByText(/complete prayer details/i)).toBeDefined();
    });
  });

  it("shows edit prayer details header when editing", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test Prayer",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      description:"Desc",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test Prayer")).toBeDefined());
    
    await user.click(screen.getByTitle(/edit this prayer/i));
    
    await waitFor(() => {
      expect(screen.getByText(/edit prayer details/i)).toBeDefined();
    });
  });

  it("shows add new update header when adding update", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test Prayer",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test Prayer")).toBeDefined());
    
    await user.click(screen.getByText("Test Prayer"));
    await user.click(screen.getByRole("button", {name: /add update/i}));
    
    await waitFor(() => {
      expect(screen.getByText(/add new update/i)).toBeDefined();
    });
  });

  it("displays prayer title in card header", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"My Prayer Title",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    
    await waitFor(() => {
      expect(screen.getByText("My Prayer Title")).toBeDefined();
    });
  });

  it("displays requester name in card header", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test",
      requester:"John Smith",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    
    await waitFor(() => {
      const requesterText = screen.getAllByText(/john smith/i);
      expect(requesterText.length).toBeGreaterThan(0);
    });
  });

  it("shows current status badge in collapsed view", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    
    await waitFor(() => {
      const currentBadges = screen.getAllByText(/current/i);
      expect(currentBadges.length).toBeGreaterThan(0);
    });
  });

  it("shows answered status badge in collapsed view", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test",
      requester:"John",
      email:"j@t.com",
      status:"answered",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    
    await waitFor(() => {
      const answeredBadges = screen.getAllByText(/answered/i);
      expect(answeredBadges.length).toBeGreaterThan(0);
    });
  });

  it("shows archived status badge in collapsed view", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test",
      requester:"John",
      email:"j@t.com",
      status:"archived",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    
    await waitFor(() => {
      const archivedBadges = screen.getAllByText(/archived/i);
      expect(archivedBadges.length).toBeGreaterThan(0);
    });
  });

  it("displays prayer form fields when editing", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      description:"Desc",
      prayer_for:"Someone",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test")).toBeDefined());
    
    await user.click(screen.getByTitle(/edit this prayer/i));
    
    await waitFor(() => {
      expect(screen.getByDisplayValue("Test")).toBeDefined();
      expect(screen.getByDisplayValue("Desc")).toBeDefined();
      expect(screen.getByDisplayValue("John")).toBeDefined();
      expect(screen.getByDisplayValue("Someone")).toBeDefined();
    });
  });

  it("displays update form fields", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test")).toBeDefined());
    
    await user.click(screen.getByText("Test"));
    await user.click(screen.getByRole("button", {name: /add update/i}));
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter the update content/i)).toBeDefined();
      expect(screen.getByPlaceholderText(/your name/i)).toBeDefined();
      expect(screen.getByPlaceholderText(/your.email@example.com/i)).toBeDefined();
    });
  });

  it("shows status dropdown when searching", async () => {
    render(<PrayerSearch />);
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(2);
  });

  it("shows approval dropdown when searching", async () => {
    render(<PrayerSearch />);
    const approvalLabel = screen.getByText(/approval status/i);
    expect(approvalLabel).toBeDefined();
  });

  it("displays created date badge in card", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-15T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    
    await waitFor(() => {
      expect(screen.getByText(/created:/i)).toBeDefined();
    });
  });

  it("renders search component title", () => {
    render(<PrayerSearch />);
    expect(screen.getByText(/prayer editor/i)).toBeDefined();
  });

  it("renders search component description", () => {
    render(<PrayerSearch />);
    expect(screen.getByText(/search and filter prayers/i)).toBeDefined();
  });

  it("shows search placeholder text", () => {
    render(<PrayerSearch />);
    const input = screen.getByPlaceholderText(/search by title, requester, email, description, or denial reasons/i);
    expect(input).toBeDefined();
  });

  it("shows search button", () => {
    render(<PrayerSearch />);
    const button = screen.getByRole("button", {name: /^search$/i});
    expect(button).toBeDefined();
  });

  it("displays status filter label", () => {
    render(<PrayerSearch />);
    expect(screen.getByText(/prayer status/i)).toBeDefined();
  });

  it("displays approval filter label", () => {
    render(<PrayerSearch />);
    expect(screen.getByText(/approval status/i)).toBeDefined();
  });

  it("shows select status prompt in filter", () => {
    render(<PrayerSearch />);
    expect(screen.getByText(/select status.../i)).toBeDefined();
  });

  it("shows select approval prompt in filter", () => {
    render(<PrayerSearch />);
    expect(screen.getByText(/select approval.../i)).toBeDefined();
  });

  it("shows instruction to select filter", () => {
    render(<PrayerSearch />);
    expect(screen.getByText(/select a filter from the dropdowns to automatically load results/i)).toBeDefined();
  });

  it("shows instruction about denied filter", () => {
    render(<PrayerSearch />);
    expect(screen.getByText(/select "denied" to see all denied prayers and activities/i)).toBeDefined();
  });

  it("shows checkbox label in expanded prayer view", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });

  it("displays edit and delete action buttons", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => {
      expect(screen.getByTitle(/edit this prayer/i)).toBeDefined();
      expect(screen.getByTitle(/delete this prayer/i)).toBeDefined();
    });
  });

  it("renders prayer card with key information", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Important Prayer",
      requester:"Jane Doe",
      email:"jane@example.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => {
      expect(screen.getByText("Important Prayer")).toBeDefined();
      expect(screen.getByText("jane@example.com")).toBeDefined();
    });
  });

  it("displays update count when prayer has updates", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[
        {id:"u1",content:"Update 1",author:"A1",created_at:"2025-01-02T00:00:00Z",approval_status:"approved"},
        {id:"u2",content:"Update 2",author:"A2",created_at:"2025-01-03T00:00:00Z",approval_status:"approved"}
      ]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test")).toBeDefined());
    await user.click(screen.getByText("Test"));
    await waitFor(() => {
      expect(screen.getByText(/prayer updates \(2\)/i)).toBeDefined();
    });
  });

  it("shows save and cancel buttons in edit mode", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      description:"Desc",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test")).toBeDefined());
    await user.click(screen.getByTitle(/edit this prayer/i));
    await waitFor(() => {
      expect(screen.getByRole("button", {name: /save/i})).toBeDefined();
      expect(screen.getByRole("button", {name: /cancel/i})).toBeDefined();
    });
  });

  it("shows save update and cancel buttons in add update mode", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test")).toBeDefined());
    await user.click(screen.getByText("Test"));
    await user.click(screen.getByRole("button", {name: /add update/i}));
    await waitFor(() => {
      expect(screen.getByRole("button", {name: /save update/i})).toBeDefined();
      const cancelButtons = screen.getAllByRole("button", {name: /cancel/i});
      expect(cancelButtons.length).toBeGreaterThan(0);
    });
  });

  it("calls delete handler when delete button is clicked", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    
    setMockPrayerData([{
      id:"1",
      title:"Prayer to Delete",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Prayer to Delete")).toBeDefined());
    
    const deleteBtn = screen.getByTitle(/delete this prayer/i);
    await user.click(deleteBtn);
    
    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringContaining('Are you sure you want to delete the prayer "Prayer to Delete"')
    );
    
    confirmSpy.mockRestore();
  });

  it("confirms deletion when user accepts", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    setMockPrayerData([{
      id:"1",
      title:"Prayer to Delete Confirmed",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Prayer to Delete Confirmed")).toBeDefined());
    
    const deleteBtn = screen.getByTitle(/delete this prayer/i);
    await user.click(deleteBtn);
    
    expect(confirmSpy).toHaveBeenCalled();
    
    confirmSpy.mockRestore();
  });

  it("displays denial reason for prayer with long text", async () => {
    const user = userEvent.setup();
    const longReason = "This prayer request contains inappropriate content that does not align with our community standards. Please review our guidelines before submitting.";
    
    setMockPrayerData([{
      id:"1",
      title:"Prayer with Long Denial",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"denied",
      denial_reason:longReason,
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Prayer with Long Denial")).toBeDefined());
    
    await user.click(screen.getByText("Prayer with Long Denial"));
    
    await waitFor(() => {
      expect(screen.getByText(longReason)).toBeDefined();
    });
  });

  it("does not show denial reason section when not denied", async () => {
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
      expect(screen.queryByText(/this content violates/i)).toBeNull();
    });
  });

  it("handles delete button click with stopPropagation", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    
    setMockPrayerData([{
      id:"1",
      title:"Test Prayer",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    await waitFor(() => expect(screen.getByText("Test Prayer")).toBeDefined());
    
    // Click delete button - should not expand/collapse the card
    const deleteBtn = screen.getByTitle(/delete this prayer/i);
    await user.click(deleteBtn);
    
    // Verify confirm was called
    expect(confirmSpy).toHaveBeenCalled();
    
    confirmSpy.mockRestore();
  });

  it("displays multiple prayers with denial reasons", async () => {
    const user = userEvent.setup();
    setMockPrayerData([
      {
        id:"1",
        title:"Denied Prayer 1",
        requester:"John",
        email:"j@t.com",
        status:"current",
        approval_status:"denied",
        denial_reason:"Reason 1",
        created_at:"2025-01-01T00:00:00Z",
        prayer_updates:[]
      },
      {
        id:"2",
        title:"Denied Prayer 2",
        requester:"Jane",
        email:"jane@t.com",
        status:"current",
        approval_status:"denied",
        denial_reason:"Reason 2",
        created_at:"2025-01-02T00:00:00Z",
        prayer_updates:[]
      }
    ]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    
    await waitFor(() => {
      expect(screen.getByText("Denied Prayer 1")).toBeDefined();
      expect(screen.getByText("Denied Prayer 2")).toBeDefined();
    });
    
    // Expand first prayer
    await user.click(screen.getByText("Denied Prayer 1"));
    await waitFor(() => {
      expect(screen.getByText("Reason 1")).toBeDefined();
    });
    
    // Expand second prayer
    await user.click(screen.getByText("Denied Prayer 2"));
    await waitFor(() => {
      expect(screen.getByText("Reason 2")).toBeDefined();
    });
  });

  it("shows prayer with all fields populated", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Complete Prayer",
      requester:"John Doe",
      email:"john@example.com",
      status:"current",
      approval_status:"approved",
      prayer_for:"Jane Smith",
      description:"This is a complete prayer with all fields",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[
        {id:"u1",content:"Update 1",author:"Author 1",created_at:"2025-01-02T00:00:00Z",approval_status:"approved"}
      ]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    
    await waitFor(() => {
      expect(screen.getByText("Complete Prayer")).toBeDefined();
    });
    
    await user.click(screen.getByText("Complete Prayer"));
    
    await waitFor(() => {
      expect(screen.getByText("This is a complete prayer with all fields")).toBeDefined();
      expect(screen.getByText(/praying for:/i)).toBeDefined();
      expect(screen.getByText("Jane Smith")).toBeDefined();
    });
  });

  it("handles prayer with null email", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Prayer Without Email",
      requester:"John",
      email:null,
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    
    await waitFor(() => {
      expect(screen.getByText("Prayer Without Email")).toBeDefined();
      expect(screen.getByText(/john/i)).toBeDefined();
    });
  });

  it("handles prayer with null description", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Prayer Without Description",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      description:null,
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    
    await waitFor(() => {
      expect(screen.getByText("Prayer Without Description")).toBeDefined();
    });
    
    await user.click(screen.getByText("Prayer Without Description"));
    
    await waitFor(() => {
      // Should not crash, just not show description section
      expect(screen.queryByText(/prayer description/i)).toBeNull();
    });
  });

  it("handles prayer with empty prayer_for field", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Prayer",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      prayer_for:"",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    
    await waitFor(() => {
      expect(screen.getByText("Prayer")).toBeDefined();
    });
    
    await user.click(screen.getByText("Prayer"));
    
    await waitFor(() => {
      // Should not show praying for section with empty value
      expect(screen.queryByText(/praying for:/i)).toBeNull();
    });
  });

  it("displays prayer with pending approval in expanded state", async () => {
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
    
    await waitFor(() => {
      expect(screen.getByText("Pending Prayer")).toBeDefined();
    });
    
    await user.click(screen.getByText("Pending Prayer"));
    
    await waitFor(() => {
      expect(screen.getByText(/approval status:/i)).toBeDefined();
      const pendingBadges = screen.getAllByText(/pending/i);
      expect(pendingBadges.length).toBeGreaterThan(0);
    });
  });

  it("shows edit button is clickable", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      description:"Desc",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    
    await waitFor(() => {
      const editBtn = screen.getByTitle(/edit this prayer/i);
      expect(editBtn).toBeDefined();
      expect(editBtn).not.toBeDisabled();
    });
  });

  it("shows delete button is clickable when not deleting", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    
    await waitFor(() => {
      const deleteBtn = screen.getByTitle(/delete this prayer/i);
      expect(deleteBtn).toBeDefined();
      expect(deleteBtn).not.toBeDisabled();
    });
  });

  it("handles clicking on prayer card to expand", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Expandable Prayer",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      description:"Hidden until expanded",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    
    await waitFor(() => {
      expect(screen.getByText("Expandable Prayer")).toBeDefined();
    });
    
    // Should not see description yet
    expect(screen.queryByText("Hidden until expanded")).toBeNull();
    
    // Click to expand
    await user.click(screen.getByText("Expandable Prayer"));
    
    // Now should see description
    await waitFor(() => {
      expect(screen.getByText("Hidden until expanded")).toBeDefined();
    });
  });

  it("displays prayer with updates in collapsed state", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Prayer with Updates",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[
        {id:"u1",content:"Update",author:"A",created_at:"2025-01-02T00:00:00Z",approval_status:"approved"}
      ]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    
    await waitFor(() => {
      expect(screen.getByText("Prayer with Updates")).toBeDefined();
    });
  });

  it("displays prayer title as clickable", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Clickable Title",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      description:"Content",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    
    await waitFor(() => {
      const title = screen.getByText("Clickable Title");
      expect(title).toBeDefined();
    });
    
    await user.click(screen.getByText("Clickable Title"));
    
    await waitFor(() => {
      expect(screen.getByText("Content")).toBeDefined();
    });
  });

  it("renders prayer with archived status badge", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Archived Prayer",
      requester:"John",
      email:"j@t.com",
      status:"archived",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    
    await waitFor(() => {
      expect(screen.getByText("Archived Prayer")).toBeDefined();
      const archivedBadges = screen.getAllByText(/archived/i);
      expect(archivedBadges.length).toBeGreaterThan(0);
    });
  });

  it("handles search with empty search term", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test Prayer",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    
    const searchBtn = screen.getByRole("button", {name: /^search$/i});
    await user.click(searchBtn);
    
    // Should handle search with empty term
    expect(searchBtn).toBeDefined();
  });

  it("displays prayer card in compact format", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Compact Prayer",
      requester:"John Doe",
      email:"john@test.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    
    await waitFor(() => {
      // Should show compact info
      expect(screen.getByText("Compact Prayer")).toBeDefined();
      expect(screen.getByText("john@test.com")).toBeDefined();
    });
  });

  it("shows prayer status and approval status together", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test",
      requester:"John",
      email:"j@t.com",
      status:"answered",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    
    await waitFor(() => {
      const answeredBadges = screen.getAllByText(/answered/i);
      const approvedBadges = screen.getAllByText(/approved/i);
      expect(answeredBadges.length).toBeGreaterThan(0);
      expect(approvedBadges.length).toBeGreaterThan(0);
    });
  });

  it("displays checkbox for each prayer", async () => {
    const user = userEvent.setup();
    setMockPrayerData([
      {id:"1",title:"Prayer 1",requester:"J",email:"j@t.com",status:"current",approval_status:"approved",created_at:"2025-01-01T00:00:00Z",prayer_updates:[]},
      {id:"2",title:"Prayer 2",requester:"J",email:"j@t.com",status:"current",approval_status:"approved",created_at:"2025-01-02T00:00:00Z",prayer_updates:[]}
    ]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    
    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      // Should have select-all plus one for each prayer
      expect(checkboxes.length).toBeGreaterThanOrEqual(3);
    });
  });

  it("shows action buttons for each prayer", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Test",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    
    await waitFor(() => {
      expect(screen.getByTitle(/edit this prayer/i)).toBeDefined();
      expect(screen.getByTitle(/delete this prayer/i)).toBeDefined();
    });
  });

  it("renders prayer card with proper styling", async () => {
    const user = userEvent.setup();
    setMockPrayerData([{
      id:"1",
      title:"Styled Prayer",
      requester:"John",
      email:"j@t.com",
      status:"current",
      approval_status:"approved",
      created_at:"2025-01-01T00:00:00Z",
      prayer_updates:[]
    }]);
    render(<PrayerSearch />);
    await user.selectOptions(screen.getAllByRole('combobox')[0], "all");
    
    await waitFor(() => {
      const prayer = screen.getByText("Styled Prayer");
      expect(prayer).toBeDefined();
    });
  });
});
