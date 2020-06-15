import Dexie from 'dexie';

interface Convertion {
    timestamp: number,
    from: string,
    to: string,
    value: string,
    result: number,
}

const db = new Dexie('myDb') as any;
db.version(1).stores({
    historyOfConvertions: `timestamp,from,to,value,result`
});

export default db;