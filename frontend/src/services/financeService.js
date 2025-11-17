import axios from "axios";
import server from "../environment";

const financeClient = axios.create({
    baseURL: `${server}/api/v1/finance`
});

export const getFinanceData = async (token) => {
    try {
        const response = await financeClient.get("/", {
            params: { token }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching finance data:", error);
        throw error;
    }
};

export const updateFinanceData = async (token, data) => {
    try {
        const response = await financeClient.put("/", {
            token,
            ...data
        });
        return response.data;
    } catch (error) {
        console.error("Error updating finance data:", error);
        throw error;
    }
};

export const addTransaction = async (token, transaction) => {
    try {
        const response = await financeClient.post("/transaction", {
            token,
            transaction
        });
        return response.data;
    } catch (error) {
        console.error("Error adding transaction:", error);
        throw error;
    }
};

export const addSavingsAccount = async (token, account) => {
    try {
        const response = await financeClient.post("/savings", {
            token,
            account
        });
        return response.data;
    } catch (error) {
        console.error("Error adding savings account:", error);
        throw error;
    }
};

export const addStock = async (token, stock) => {
    try {
        const response = await financeClient.post("/stock", {
            token,
            stock
        });
        return response.data;
    } catch (error) {
        console.error("Error adding stock:", error);
        throw error;
    }
};

export const addMutualFund = async (token, mutualFund) => {
    try {
        const response = await financeClient.post("/mutual-fund", {
            token,
            mutualFund
        });
        return response.data;
    } catch (error) {
        console.error("Error adding mutual fund:", error);
        throw error;
    }
};

export const addSIPPlan = async (token, sipPlan) => {
    try {
        const response = await financeClient.post("/sip", {
            token,
            sipPlan
        });
        return response.data;
    } catch (error) {
        console.error("Error adding SIP plan:", error);
        throw error;
    }
};

export const deleteFinanceItem = async (token, category, itemId) => {
    try {
        const response = await financeClient.delete("/delete", {
            data: { token, category, itemId }
        });
        return response.data;
    } catch (error) {
        console.error("Error deleting item:", error);
        throw error;
    }
};

// SIP Calculator function
export const calculateSIP = (monthlyAmount, annualReturn, years) => {
    const monthlyRate = annualReturn / 100 / 12;
    const months = years * 12;
    
    // Future Value of SIP = P * [((1 + r)^n - 1) / r] * (1 + r)
    const futureValue = monthlyAmount * 
        (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
    
    const totalInvested = monthlyAmount * months;
    const returns = futureValue - totalInvested;
    const returnPercentage = (returns / totalInvested) * 100;
    
    return {
        totalInvested: Math.round(totalInvested),
        futureValue: Math.round(futureValue),
        returns: Math.round(returns),
        returnPercentage: parseFloat(returnPercentage.toFixed(2))
    };
};

