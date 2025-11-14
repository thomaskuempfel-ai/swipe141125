import { HistoricReport, PetProfile } from '../types';

export interface WellnessAlert {
    type: 'health' | 'permission' | 'data' | 'api';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    action?: string;
}

export interface EmotionTrendPoint {
    date: string;
    emotion: string;
    confidence: number;
    timestamp: number;
}

export interface NeedsVector {
    attention: number;
    play: number;
    comfort: number;
    food: number;
    rest: number;
    health: number;
    water: number;
}

export const getLatestReport = (reports: HistoricReport[]): HistoricReport | null => {
    if (reports.length === 0) return null;
    return [...reports].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
};

export const getEmotionTrend = (reports: HistoricReport[], days: number = 14): EmotionTrendPoint[] => {
    const now = Date.now();
    const cutoff = now - (days * 24 * 60 * 60 * 1000);
    
    return reports
        .filter(r => new Date(r.timestamp).getTime() >= cutoff)
        .map(r => ({
            date: new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            emotion: r.emotion,
            confidence: r.emotionScores[r.emotion.toLowerCase() as keyof typeof r.emotionScores] || 0,
            timestamp: new Date(r.timestamp).getTime()
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
};

export const getAverageNeeds = (reports: HistoricReport[], days: number = 7): NeedsVector => {
    const now = Date.now();
    const cutoff = now - (days * 24 * 60 * 60 * 1000);
    
    const recentReports = reports.filter(r => 
        new Date(r.timestamp).getTime() >= cutoff
    );
    
    if (recentReports.length === 0) {
        return {
            attention: 0,
            play: 0,
            comfort: 0,
            food: 0,
            rest: 0,
            health: 0,
            water: 0
        };
    }
    
    const sum = recentReports.reduce((acc, r) => ({
        attention: acc.attention + r.currentNeeds.attention,
        play: acc.play + r.currentNeeds.play,
        comfort: acc.comfort + r.currentNeeds.comfort,
        food: acc.food + r.currentNeeds.food,
        rest: acc.rest + r.currentNeeds.rest,
        health: acc.health + r.currentNeeds.health,
        water: acc.water + r.currentNeeds.water
    }), {
        attention: 0,
        play: 0,
        comfort: 0,
        food: 0,
        rest: 0,
        health: 0,
        water: 0
    });
    
    const count = recentReports.length;
    return {
        attention: Math.round(sum.attention / count),
        play: Math.round(sum.play / count),
        comfort: Math.round(sum.comfort / count),
        food: Math.round(sum.food / count),
        rest: Math.round(sum.rest / count),
        health: Math.round(sum.health / count),
        water: Math.round(sum.water / count)
    };
};

export const getSleepTrend = (reports: HistoricReport[], days: number = 14) => {
    const now = Date.now();
    const cutoff = now - (days * 24 * 60 * 60 * 1000);
    
    return reports
        .filter(r => r.sleepAnalysis && new Date(r.timestamp).getTime() >= cutoff)
        .map(r => ({
            date: new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            quality: r.sleepAnalysis!.sleepQuality,
            disturbances: r.sleepAnalysis!.disturbances,
            timestamp: new Date(r.timestamp).getTime()
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
};

export const getVocalizationTrend = (reports: HistoricReport[], days: number = 14) => {
    const now = Date.now();
    const cutoff = now - (days * 24 * 60 * 60 * 1000);
    
    return reports
        .filter(r => r.audioAnalysis && new Date(r.timestamp).getTime() >= cutoff)
        .map(r => ({
            date: new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            type: r.audioAnalysis!.vocalizationType,
            intensity: r.audioAnalysis!.intensity,
            timestamp: new Date(r.timestamp).getTime()
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
};

export const getWellnessAlerts = (
    reports: HistoricReport[],
    pet: PetProfile | null,
    notificationPermission: NotificationPermission
): WellnessAlert[] => {
    const alerts: WellnessAlert[] = [];
    
    const latestReport = getLatestReport(reports);
    
    if (latestReport?.sicknessIndicators) {
        const level = latestReport.sicknessIndicators.overallConcernLevel;
        alerts.push({
            type: 'health',
            severity: level === 'Very High' ? 'critical' : level === 'High' ? 'high' : 'medium',
            title: 'Health Alert Detected',
            message: latestReport.sicknessIndicators.summary,
            action: 'View Details'
        });
    }
    
    if (notificationPermission !== 'granted') {
        alerts.push({
            type: 'permission',
            severity: 'low',
            title: 'Enable Notifications',
            message: 'Get daily tips and health alerts for your pet',
            action: 'Enable'
        });
    }
    
    if (reports.length < 3) {
        alerts.push({
            type: 'data',
            severity: 'low',
            title: 'Build Your Pet\'s Profile',
            message: `${3 - reports.length} more ${reports.length === 2 ? 'analysis' : 'analyses'} needed for personality insights`,
            action: 'Analyze Now'
        });
    }
    
    const recentReports = reports.filter(r => 
        Date.now() - new Date(r.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000
    );
    
    if (recentReports.length === 0 && reports.length > 0) {
        alerts.push({
            type: 'data',
            severity: 'medium',
            title: 'Time for a Check-in',
            message: 'No recent analyses. Check on your pet to keep insights fresh',
            action: 'Start Analysis'
        });
    }
    
    return alerts.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
    });
};

export const getEngagementStreak = (reports: HistoricReport[]): number => {
    if (reports.length === 0) return 0;
    
    const sortedReports = [...reports].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const report of sortedReports) {
        const reportDate = new Date(report.timestamp);
        reportDate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((currentDate.getTime() - reportDate.getTime()) / (24 * 60 * 60 * 1000));
        
        if (daysDiff === streak) {
            streak++;
        } else if (daysDiff > streak) {
            break;
        }
    }
    
    return streak;
};

export const getTopNeeds = (needs: NeedsVector, count: number = 2): Array<{ need: string; score: number }> => {
    const needsArray = Object.entries(needs).map(([need, score]) => ({ need, score }));
    return needsArray
        .sort((a, b) => b.score - a.score)
        .slice(0, count);
};

export const calculateWellnessScore = (
    reports: HistoricReport[],
    guardianScore: number
): number => {
    if (reports.length === 0) return guardianScore;
    
    const latestReport = getLatestReport(reports);
    if (!latestReport) return guardianScore;
    
    let score = guardianScore;
    
    const positiveEmotions = ['Calm', 'Playful'];
    if (positiveEmotions.includes(latestReport.emotion)) {
        score += 5;
    }
    
    if (latestReport.sicknessIndicators) {
        const level = latestReport.sicknessIndicators.overallConcernLevel;
        if (level === 'Very High') score -= 20;
        else if (level === 'High') score -= 10;
    }
    
    const avgNeeds = getAverageNeeds(reports, 7);
    if (avgNeeds.health > 60) {
        score -= 10;
    }
    
    const streak = getEngagementStreak(reports);
    score += Math.min(streak * 2, 20);
    
    return Math.max(0, Math.min(100, score));
};
