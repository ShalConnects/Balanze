import { supabase } from './supabase';

/** Dev-only test credentials — never used in production bundles when gated by import.meta.env.DEV */
const TEST_USERS = {
  admin: {
    email: 'admin@test.com',
    password: 'testpass123',
    fullName: 'Test Admin User'
  },
  user: {
    email: 'user@test.com',
    password: 'testpass123',
    fullName: 'Test Regular User'
  },
  premium: {
    email: 'premium@test.com',
    password: 'testpass123',
    fullName: 'Test Premium User'
  }
} as const;

type TestUserType = keyof typeof TEST_USERS;

function assertDevOnly(): void {
  if (!import.meta.env.DEV) {
    throw new Error('TestAuth is only available in development');
  }
}

export class TestAuthManager {
  private static instance: TestAuthManager;
  private currentTestUser: { id: string; email?: string } | null = null;

  static getInstance(): TestAuthManager {
    if (!TestAuthManager.instance) {
      TestAuthManager.instance = new TestAuthManager();
    }
    return TestAuthManager.instance;
  }

  async setupTestUsers() {
    assertDevOnly();

    for (const [, userData] of Object.entries(TEST_USERS)) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              fullName: userData.fullName
            }
          }
        });

        if (!error && data.user) {
          await this.createUserProfile(data.user.id, userData.fullName);
        }
      } catch {
        // Ignore setup failures for existing users
      }
    }
  }

  private async createUserProfile(
    userId: string,
    fullName: string,
    subscription?: {
      plan: 'free' | 'premium';
      status: 'active' | 'inactive' | 'cancelled';
      validUntil: string | null;
    }
  ) {
    try {
      await supabase.from('profiles').upsert({
        id: userId,
        full_name: fullName,
        local_currency: 'USD',
        selected_currencies: ['USD', 'EUR'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...(subscription ? { subscription } : {})
      });
    } catch {
      // Ignore profile creation errors
    }
  }

  async loginAsTestUser(userType: TestUserType = 'user') {
    assertDevOnly();
    const userData = TEST_USERS[userType];

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (session?.user?.email === userData.email) {
        this.currentTestUser = session.user;
        return { success: true, user: session.user };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password
      });

      if (error) {
        return { success: false, error };
      }

      this.currentTestUser = data.user;
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error };
    }
  }

  getCurrentTestUser() {
    return this.currentTestUser;
  }

  async logoutTestUser() {
    assertDevOnly();
    try {
      await supabase.auth.signOut();
      this.currentTestUser = null;
    } catch {
      // Ignore logout errors
    }
  }

  getTestUserCredentials() {
    assertDevOnly();
    return TEST_USERS;
  }

  async createCustomTestUser(
    email: string,
    password: string,
    fullName: string,
    subscription?: {
      plan: 'free' | 'premium';
      status: 'active' | 'inactive' | 'cancelled';
      validUntil: string | null;
    }
  ) {
    assertDevOnly();
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            fullName
          }
        }
      });

      if (error) {
        return { success: false, error };
      }

      if (data.user) {
        await this.createUserProfile(data.user.id, fullName, subscription);
      }

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error };
    }
  }

  async getCurrentSession() {
    assertDevOnly();
    const {
      data: { session }
    } = await supabase.auth.getSession();
    return session;
  }
}

export const testAuth = TestAuthManager.getInstance();
