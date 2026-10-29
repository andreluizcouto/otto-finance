const STARTED_KEY = 'otto_started';

// Só lembra se a tela de boas-vindas já foi vista; os dados ficam no banco local da API.
export const hasStarted = (): boolean => {
  try {
    return localStorage.getItem(STARTED_KEY) === '1';
  } catch {
    return false;
  }
};

export const markStarted = (): void => {
  try {
    localStorage.setItem(STARTED_KEY, '1');
  } catch {
    // sem localStorage a tela de boas-vindas só aparece de novo
  }
};
