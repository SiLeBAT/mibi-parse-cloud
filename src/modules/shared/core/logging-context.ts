export type ParseLogger = {
    info: (message: string) => void;
    error: (message: string) => void;
};

let logger: ParseLogger | null = {
    info: (message: string) => {
        console.log(message);
    },
    error: (message: string) => {
        console.error(message);
    }
};
function setLoggingContext(newLogger: ParseLogger | null) {
    logger = newLogger;
}

function getLogger() {
    return (
        logger || {
            info: (message: string) => {
                console.log(message);
            },
            error: (message: string) => {
                console.error(message);
            }
        }
    );
}

export { getLogger, setLoggingContext };
