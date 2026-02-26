import { VALIDATION } from '../constants';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  
  if (!email) {
    errors.push('Email обязателен');
  } else {
    if (email.length > VALIDATION.email.maxLength) {
      errors.push(`Email слишком длинный (макс. ${VALIDATION.email.maxLength} символов)`);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Некорректный формат email');
    }
  }
  
  return { valid: errors.length === 0, errors };
}

export function validateCreatorNick(creatorNick: string): ValidationResult {
  const errors: string[] = [];
  const { minLength, maxLength, pattern } = VALIDATION.creatorNick;
  
  if (!creatorNick) {
    errors.push('creatorNick обязателен');
  } else {
    if (creatorNick.length < minLength) {
      errors.push(`Минимум ${minLength} символа`);
    }
    if (creatorNick.length > maxLength) {
      errors.push(`Максимум ${maxLength} символов`);
    }
    if (!pattern.test(creatorNick)) {
      errors.push('Только латинские буквы, цифры и _');
    }
  }
  
  return { valid: errors.length === 0, errors };
}

export const validateUsername = validateCreatorNick;

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  const { minLength, maxLength } = VALIDATION.password;
  
  if (!password) {
    errors.push('Пароль обязателен');
  } else {
    if (password.length < minLength) {
      errors.push(`Минимум ${minLength} символов`);
    }
    if (password.length > maxLength) {
      errors.push(`Максимум ${maxLength} символов`);
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Нужна хотя бы одна заглавная буква');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Нужна хотя бы одна строчная буква');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Нужна хотя бы одна цифра');
    }
  }
  
  return { valid: errors.length === 0, errors };
}

export function validatePasswordMatch(password: string, confirm: string): ValidationResult {
  const errors: string[] = [];
  
  if (password !== confirm) {
    errors.push('Пароли не совпадают');
  }
  
  return { valid: errors.length === 0, errors };
}

export function validateComicTitle(title: string): ValidationResult {
  const errors: string[] = [];
  const { minLength, maxLength } = VALIDATION.comicTitle;
  
  if (!title || title.trim().length === 0) {
    errors.push('Название обязательно');
  } else {
    if (title.length < minLength) {
      errors.push(`Минимум ${minLength} символ`);
    }
    if (title.length > maxLength) {
      errors.push(`Максимум ${maxLength} символов`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

export function validateRegistration(data: {
  email: string;
  password: string;
  confirmPassword: string;
}): ValidationResult {
  const allErrors: string[] = [];
  
  const emailResult = validateEmail(data.email);
  const passwordResult = validatePassword(data.password);
  const matchResult = validatePasswordMatch(data.password, data.confirmPassword);
  
  allErrors.push(...emailResult.errors);
  allErrors.push(...passwordResult.errors);
  allErrors.push(...matchResult.errors);
  
  return { valid: allErrors.length === 0, errors: allErrors };
}
