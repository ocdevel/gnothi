import {ResultSetOptions, SqlParameter} from "@aws-sdk/client-rds-data";

// Partial to be combined via custom code
export interface ExecuteStatementRequestPartial {
    database?: string;
    sql: string | undefined;
    parameters?: SqlParameter[];
    // schema?: string;
    // transactionId?: string;
    // includeResultMetadata?: boolean;
    // continueAfterTimeout?: boolean;
    // resultSetOptions?: ResultSetOptions;
}
