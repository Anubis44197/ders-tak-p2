// ...existing code from App.tsx...
import React, { useState, useEffect, useRef } from 'react';
import ParentDashboard from '../components/parent/ParentDashboard';
import ChildDashboard from '../components/child/ChildDashboard';
import ParentLockScreen from '../components/parent/ParentLockScreen';
import { UserType, Course, Task, PerformanceData, TaskCompletionData, Reward, Badge, ReportData } from '../types';
import { GraduationCap, User, Users, Trash2, CheckCircle, XCircle, BadgeCheck, BookMarked, Download, FileText, Home } from '../components/icons';
import { ALL_ICONS } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";
import { getTasksFromCloud, setTasksToCloud, getArchiveFromCloud, setArchiveToCloud, getApiKeyFromCloud, setApiKeyToCloud } from '../cloudSync';

// ...rest of App.tsx code...
