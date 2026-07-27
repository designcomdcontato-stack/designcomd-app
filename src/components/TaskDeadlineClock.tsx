import React from 'react';
import { parseISO, differenceInDays, format, isValid } from 'date-fns';
import { TaskStatus } from '../types';
import { cn, formatDate } from '../lib/utils';

interface TaskDeadlineClockProps {
  createdAt?: string;
  deliveryDate: string;
  status: TaskStatus;
  className?: string;
  showText?: boolean;
}

export const TaskDeadlineClock: React.FC<TaskDeadlineClockProps> = ({
  createdAt,
  deliveryDate,
  status,
  className = '',
  showText = true,
}) => {
  // Parse creation date
  let startDate: Date;
  if (createdAt) {
    const parsed = new Date(createdAt);
    startDate = isValid(parsed) ? parsed : new Date();
  } else {
    // Fallback: 7 days before delivery date
    const delDate = parseISO(deliveryDate);
    if (isValid(delDate)) {
      startDate = new Date(delDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date();
    }
  }

  // Parse delivery date (end of day 23:59:59)
  const delDate = parseISO(deliveryDate);
  let dueDate: Date;
  if (isValid(delDate)) {
    dueDate = new Date(delDate.getFullYear(), delDate.getMonth(), delDate.getDate(), 23, 59, 59);
  } else {
    dueDate = new Date();
  }

  const now = new Date();
  const startMs = startDate.getTime();
  const dueMs = dueDate.getTime();
  const nowMs = now.getTime();

  // Total time duration (minimum 24 hours to avoid div by zero)
  const totalMs = Math.max(dueMs - startMs, 1000 * 60 * 60 * 24);
  const elapsedMs = Math.max(nowMs - startMs, 0);

  let rawPercentage = (elapsedMs / totalMs) * 100;
  if (rawPercentage < 0) rawPercentage = 0;
  if (rawPercentage > 100) rawPercentage = 100;

  const isCompleted = status === 'Feito';
  const isOverdue = !isCompleted && nowMs > dueMs;

  const clockPercentage = isCompleted ? 100 : Math.round(rawPercentage);

  // Time remaining calculation
  const daysLeft = Math.ceil((dueMs - nowMs) / (1000 * 60 * 60 * 24));
  let statusText = '';
  
  const formattedOpenDate = isValid(startDate) ? format(startDate, 'dd/MM/yyyy') : 'N/A';
  const formattedDueDate = isValid(dueDate) ? format(dueDate, 'dd/MM/yyyy') : formatDate(deliveryDate);

  let tooltipText = `Aberto em: ${formattedOpenDate}\nEntrega: ${formattedDueDate}`;

  if (isCompleted) {
    statusText = 'Concluído';
    tooltipText += '\nStatus: Concluído (Feito)';
  } else if (isOverdue) {
    const overdueDays = Math.abs(differenceInDays(now, dueDate));
    statusText = overdueDays === 0 ? 'Venceu hoje!' : `Atrasado ${overdueDays}d`;
    tooltipText += `\nStatus: Atrasado (${overdueDays} dias após o prazo)`;
  } else {
    if (daysLeft === 0) {
      statusText = 'Vence hoje!';
    } else if (daysLeft === 1) {
      statusText = 'Vence amanhã';
    } else {
      statusText = `${daysLeft}d restantes`;
    }
    tooltipText += `\nPrazo: ${clockPercentage}% decorrido (${daysLeft}d restantes)`;
  }

  // Colors
  let strokeColor = '#4f46e5'; // Brand Indigo
  let strokeBg = '#e0e7ff';

  if (isCompleted) {
    strokeColor = '#10b981'; // Emerald
    strokeBg = '#d1fae5';
  } else if (isOverdue) {
    strokeColor = '#f43f5e'; // Rose
    strokeBg = '#ffe4e6';
  } else if (clockPercentage >= 80 || daysLeft <= 2) {
    strokeColor = '#f59e0b'; // Amber
    strokeBg = '#fef3c7';
  }

  // SVG Math
  const size = 22;
  const strokeWidth = 2.5;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clockPercentage / 100) * circumference;

  return (
    <div 
      className={cn("inline-flex items-center gap-2 group/clock cursor-help", className)}
      title={tooltipText}
    >
      {/* Clock SVG Dial */}
      <div className="relative w-5 h-5 flex items-center justify-center flex-shrink-0">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={strokeBg}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Clock center indicator / hand */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isCompleted ? (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          ) : isOverdue ? (
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
          ) : (
            <div className="relative w-2 h-2">
              <span 
                className="absolute top-1/2 left-1/2 w-1 h-[1.5px] bg-slate-600 origin-left"
                style={{ transform: `rotate(${Math.round((clockPercentage / 100) * 360)}deg)` }}
              />
              <span className="absolute top-1/2 left-1/2 w-[1.5px] h-1 bg-slate-600 origin-bottom -translate-x-[0.75px] -translate-y-1" />
            </div>
          )}
        </div>
      </div>

      {/* Date & Subtext */}
      {showText && (
        <div className="flex flex-col text-left">
          <span className="text-sm font-semibold text-slate-800 leading-tight">
            {formatDate(deliveryDate)}
          </span>
          <span className={cn(
            "text-[10px] font-semibold leading-none mt-0.5 transition-colors",
            isCompleted && "text-emerald-600",
            isOverdue && "text-rose-600 font-bold",
            !isCompleted && !isOverdue && (clockPercentage >= 80 || daysLeft <= 2) && "text-amber-600",
            !isCompleted && !isOverdue && clockPercentage < 80 && "text-slate-400"
          )}>
            {statusText}
          </span>
        </div>
      )}
    </div>
  );
};
