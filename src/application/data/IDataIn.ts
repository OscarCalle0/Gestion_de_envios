export interface IExampleGetIn {
    terminal: number;
}

export interface IExamplePostIn {
    entregas: {
        codigo_remision: string;
        unidades: string[];
    }[];
    equipo: string;
    terminal: number;
}
