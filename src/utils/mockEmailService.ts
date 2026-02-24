export const generateVerificationCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const simulateSendEmail = (email: string, code: string): Promise<boolean> => {
    return new Promise((resolve) => {
        console.log(`[Mock Email Service] Sending code ${code} to ${email}`);
        setTimeout(() => {
            resolve(true);
        }, 1500); // Simulate network delay
    });
};

export const simulateSendSMS = (phone: string, code: string): Promise<boolean> => {
    return new Promise((resolve) => {
        console.log(`[Mock SMS Service] Sending code ${code} to ${phone}`);
        setTimeout(() => {
            resolve(true);
        }, 1500); // Simulate network delay
    });
};
