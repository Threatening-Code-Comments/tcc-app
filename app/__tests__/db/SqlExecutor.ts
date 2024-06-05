export type SqlExecutor = {
    read: (query: string, args: any[]) => Promise<any[]>
    write: (query: string, args: any[]) => Promise<void>
}