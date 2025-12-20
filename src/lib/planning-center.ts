/**
 * Planning Center People API Integration
 * Used to validate email addresses against Planning Center member database
 */

export interface PlanningCenterAttributes {
  first_name: string;
  last_name: string;
  name: string;
  avatar: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PlanningCenterPerson {
  id: string;
  type: string;
  attributes: PlanningCenterAttributes;
}

export interface EmailLookupResult {
  people: PlanningCenterPerson[];
  count: number;
  error?: string;
}

/**
 * Lookup a person by email in Planning Center
 * Uses Supabase Edge Function to call Planning Center API with proper authentication
 */
export async function lookupPersonByEmail(email: string, supabaseUrl: string, supabaseKey: string): Promise<EmailLookupResult> {
  if (!email || email.trim() === '') {
    return {
      people: [],
      count: 0,
      error: 'Email address is required'
    };
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/planning-center-lookup`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email.trim() })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Planning Center lookup failed:', response.status, errorData);
      return {
        people: [],
        count: 0,
        error: errorData.error || 'Failed to lookup person in Planning Center'
      };
    }

    const data = await response.json();
    return {
      people: data.people || [],
      count: data.count || 0
    };
  } catch (error) {
    console.error('Error in Planning Center lookup:', error);
    return {
      people: [],
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Format a Planning Center person's name
 */
export function formatPersonName(person: PlanningCenterPerson): string {
  return person.attributes.name || `${person.attributes.first_name} ${person.attributes.last_name}`;
}
