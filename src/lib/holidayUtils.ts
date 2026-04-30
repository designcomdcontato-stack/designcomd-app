import { CommemorativeDate } from '../types';
import { format, setYear, isAfter, startOfDay, isValid } from 'date-fns';
import { parseSafeDate } from './utils';

export function getAutomaticCommemorativeDates(year: number): CommemorativeDate[] {
  const dates: { month: number; day: number; title: string }[] = [
    { month: 0, day: 1, title: 'Ano Novo' },
    { month: 0, day: 7, title: 'Dia do Leitor' },
    { month: 0, day: 30, title: 'Dia da Saudade' },
    { month: 1, day: 14, title: 'Valentine\'s Day' },
    { month: 2, day: 8, title: 'Dia da Mulher' },
    { month: 2, day: 15, title: 'Dia do Consumidor' },
    { month: 2, day: 20, title: 'Dia da Felicidade' },
    { month: 3, day: 1, title: 'Dia da Mentira' },
    { month: 3, day: 7, title: 'Dia Mundial da Saúde' },
    { month: 3, day: 21, title: 'Dia de Tiradentes' },
    { month: 3, day: 22, title: 'Dia da Terra' },
    { month: 4, day: 1, title: 'Dia do Trabalho' },
    // Mother's Day is 2nd Sunday of May - simpler to add fixed common ones or calculate
    { month: 5, day: 5, title: 'Dia do Meio Ambiente' },
    { month: 5, day: 12, title: 'Dia dos Namorados' },
    { month: 6, day: 13, title: 'Dia do Rock' },
    { month: 6, day: 20, title: 'Dia do Amigo' },
    { month: 6, day: 26, title: 'Dia dos Avós' },
    { month: 7, day: 15, title: 'Dia da Informática' },
    { month: 8, day: 5, title: 'Dia do Irmão' },
    { month: 8, day: 7, title: 'Independência do Brasil' },
    { month: 8, day: 15, title: 'Dia do Cliente' },
    { month: 8, day: 21, title: 'Dia da Árvore' },
    { month: 9, day: 12, title: 'Dia das Crianças' },
    { month: 9, day: 15, title: 'Dia do Professor' },
    { month: 9, day: 31, title: 'Dia das Bruxas' },
    { month: 10, day: 2, title: 'Finados' },
    { month: 10, day: 15, title: 'Proclamação da República' },
    { month: 10, day: 19, title: 'Dia do Empreendedor' },
    { month: 10, day: 20, title: 'Dia da Consciência Negra' },
    { month: 11, day: 25, title: 'Natal' },
  ];

  return dates.map((d, index) => ({
    id: `auto-${year}-${index}`,
    title: d.title,
    date: format(new Date(year, d.month, d.day), 'yyyy-MM-dd'),
    type: 'automatic',
    category: 'Data comemorativa'
  }));
}

export function getUpcomingCommemorativeDate(allDates: CommemorativeDate[]): CommemorativeDate | null {
  const upcoming = getManyUpcomingDates(allDates || [], 1);
  return upcoming.length > 0 ? upcoming[0] : null;
}

export function getManyUpcomingDates(allDates: CommemorativeDate[], limit: number = 3): CommemorativeDate[] {
  const today = startOfDay(new Date());
  return (allDates || [])
    .filter(d => {
      const date = parseSafeDate(d.date);
      if (!date) return false;
      return isAfter(date, today) || format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

export function getDatesInRange(allDates: CommemorativeDate[], days: number = 7): CommemorativeDate[] {
  const today = startOfDay(new Date());
  const end = new Date(today);
  end.setDate(today.getDate() + days);

  return (allDates || [])
    .filter(d => {
      const date = parseSafeDate(d.date);
      if (!date || !isValid(date)) return false;
      const isSoon = (isAfter(date, today) || format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) &&
                     (date < end || format(date, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd'));
      return isSoon;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
