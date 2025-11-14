

export const parseTimestamp = (timestamp: string): number => {
    const parts = timestamp.split(':').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return parts[0] * 60 + parts[1];
    }
    console.warn(`Invalid timestamp format: ${timestamp}`);
    return 0;
};

export const extractFrame = (videoFile: File, time: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error("Couldn't get canvas context"));
        
        const videoUrl = URL.createObjectURL(videoFile);
        video.src = videoUrl;

        video.onloadedmetadata = () => {
            // Ensure seek time is within video duration
            const seekTime = Math.min(time, video.duration);
            if (video.currentTime !== seekTime) {
                 video.currentTime = seekTime;
            } else {
                 // If currentTime is already what we want, the 'seeked' event might not fire,
                 // so we draw directly.
                 canvas.width = video.videoWidth;
                 canvas.height = video.videoHeight;
                 ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                 const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                 URL.revokeObjectURL(videoUrl);
                 resolve(dataUrl);
            }
        };
        
        video.onseeked = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            URL.revokeObjectURL(videoUrl);
            resolve(dataUrl);
        };
        
        video.onerror = (e) => {
            URL.revokeObjectURL(videoUrl);
            console.error("Video error on frame extraction:", e);
            reject(new Error(`Failed to load or seek video at time ${time}.`));
        };
    });
};

export const getTimestampFromVideoFile = (file: File): string => {
    // The filename can be unreliable for determining the recording date.
    // The `lastModified` date is the most consistent and reliable timestamp available in the browser's File API.
    // For unmodified media files recently transferred from a device, this is often very close to the actual creation/recording date.
    // This ensures memories are sorted correctly in the calendar.
    return new Date(file.lastModified).toISOString();
};
