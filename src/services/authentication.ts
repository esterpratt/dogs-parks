import { throwError } from './error';
import { supabase } from './supabase-client';

interface LoginProps {
  email: string;
  password: string;
}

interface SigninProps extends LoginProps {
  name: string;
}

const signinWithGoogle = async () => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      console.log('error here: ', error);
      throw error;
    }
  } catch (error) {
    throwError(error);
  }
};

const signin = async ({ email, password, name }: SigninProps) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });
    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    throwError(error);
  }
};

const login = async ({ email, password }: LoginProps) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    throwError(error);
  }
};

const logout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  } catch (error) {
    throwError(error);
  }
};

const sendResetEmail = async (email: string) => {
  try {
    console.log('TODO: reset password for email: ', email);
  } catch (error) {
    throwError(error);
  }
};

const deleteUser = async (id: string | null) => {
  try {
    if (!id) {
      return;
    }

    const { error } = await supabase.functions.invoke("delete-user", {
      body: { id },
    });

    if (error) {
      throw error;
    }

    await supabase.auth.signOut();
  } catch (error) {
    throwError(error);
  }
};

export { login, logout, signin, signinWithGoogle, sendResetEmail, deleteUser };
export type { LoginProps };
