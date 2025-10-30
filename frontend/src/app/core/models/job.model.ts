export interface jobResponse {
    title: string,
    description: string,

    price: number,

    // Encrypted fields
    clientAddress: string,
    freelancerAddress: string,

    previewHash: string,
    finalHash: string,


    deliveryDeadline: { type: Number, required: true },
    approvalDeadline: { type: Number, required: true },

    status: {
        type: String,
        enum: ["pending", "funded", "deliverd", "approved", "refunded"],
        default: "pending",
    },

    isDeleted: boolean,
}
