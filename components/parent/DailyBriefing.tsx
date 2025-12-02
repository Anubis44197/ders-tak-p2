import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { 
    BarChart as BarChartIcon, BookOpen, ClipboardList, FileText, Home, PlusCircle, Trash2, 
    TrendingUp, TrendingDown, CheckCircle, Clock, ListFilter, Brain, Zap, Gift, Printer, 
    Download, ArrowUpDown, Trophy, Sparkles, BookMarked, AlertTriangle, Info, Settings, Send,
    Smile, Frown, Meh, Star, Award, Play, Pause, XCircle
} from '../icons';
import { getIconComponent } from '../../constants';
import { 
    DailyBriefingData, PerformanceData, ReportData, Task, ParentDashboardProps, 
    Course, Reward, Exam, ExamResult, TaskCompletionData 
} from '../../types';
import { GoogleGenAI } from "@google/genai";
import { isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { getLocalDateString, getShortDisplayDate, getDaysAgo, parseDate, isSameDay } from '../../utils/dateUtils';
import { processChartData, processWeeklyData, processMonthlyTrends } from '../../utils/chartDataProcessor';
import TimeRangeFilter, { type TimeFilterValue } from '../shared/TimeRangeFilter';
import EmptyState from '../shared/EmptyState';
import Modal from './shared/Modal'; // For components that use Modal
import StatCard from './shared/StatCard'; // For components that use StatCard


const DailyBriefing: React.FC<{ ai: any, tasks: Task[] }> = ({ ai, tasks }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
            <h3 className="text-xl font-bold mb-2">Günlük Özet</h3>
            <p className="text-slate-600">Bugün {tasks.filter(t => t.status === 'tamamlandı' && t.completionDate === new Date().toISOString().split('T')[0]).length} görev tamamlandı.</p>
        </div>
    );
};


export default DailyBriefing;
