import React from 'react';
import Moment from 'react-moment';
import db from '../../OfflineDatabase';

import {
    Container, Grid, Card, CardContent,
    Typography, FormControl, TextField, TableFooter,
    Button, Backdrop, CircularProgress, TableContainer,
    Table, TableHead, TableBody, TableRow, TableCell, IconButton, TablePagination
} from '@material-ui/core';

import { Autocomplete } from '@material-ui/lab';

import { ExpandMore as ExpandMoreIcon, Delete, Collections } from '@material-ui/icons';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';

import './style.css';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        backdrop: {
            zIndex: theme.zIndex.drawer + 1,
            color: '#fff',
        },
    }),
);

interface Props {
    moedaA: string,
    moedaB: string
}

interface Currencies {
    id: string,
    currencySymbol: string,
    currencyName: string
}

interface HitoryOfConvertion {
    timestamp: number,
    from: string,
    to: string,
    value: string,
    result: number
}


const Conversor = (props: Props) => {
    const styles = useStyles();

    const [moedaA, setMoedaA] = React.useState<string>('0');
    const [moedaB, setMoedaB] = React.useState<string>('0');
    const [currencies, setCurrencies] = React.useState<Currencies[]>([]);
    const [historyOfConvertion, setHistoryOfConvertion] = React.useState<HitoryOfConvertion[]>([]);

    const [convertValue, setConvertValue] = React.useState<string>("1");
    const [convertedValue, setConvertedValue] = React.useState<number>(0);
    const [openedBackdrop, setOpenedBackdrop] = React.useState(false);

    const [page, setPage] = React.useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = React.useState<number>(5);
    const [ totalRows, setTotalRows ] = React.useState<number>(0);

    React.useEffect(() => {
        
        let url = "https://free.currconv.com/api/v7/currencies?apiKey=do-not-use-this-key";
        fetch(url).then(response => response.json())
            .then(res => {

                const myObj = Object.values(res.results) as Currencies[];
                setCurrencies(myObj);
                setMoedaA(props.moedaA);
                setMoedaB(props.moedaB);
                loadHistory();
            });

    }, []);

    React.useEffect(()=>{
        loadHistory();
    },[page, rowsPerPage]);

    React.useEffect(() => {
        if (Number(convertedValue) !== 0) saveHistory();
    }, [convertedValue])

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };


    async function loadHistory() {
        const countRows = await db.historyOfConvertions.count();
        setTotalRows(countRows);
        
        const data = await db.historyOfConvertions.reverse()
            .offset((page) * rowsPerPage).limit(rowsPerPage)
            .toArray() as HitoryOfConvertion[];
        setHistoryOfConvertion(data);
    }

    function saveHistory() {
        db.historyOfConvertions.put({
            timestamp: new Date().getTime(),
            from: moedaA,
            to: moedaB,
            value: convertValue,
            result: convertedValue
        });
        loadHistory();
    }

    async function deleteHistory(timestamp: number) {
        await db.historyOfConvertions.delete(timestamp);
        loadHistory();
    }


    function handleSetMoedaA(event: React.ChangeEvent<{}>, value: Currencies | null, reason: string) {
        if (value != null) setMoedaA(value.id);
    }

    function handleSetMoedaB(event: React.ChangeEvent<{}>, value: Currencies | null, reason: string) {
        if (value != null) setMoedaB(value.id);
    }

    function handleConvertValue(event: React.ChangeEvent<HTMLInputElement>) {
        setConvertValue(event.currentTarget.value);
    }

    function handleConvertButton() {
        setOpenedBackdrop(true);
        let de_para = `${moedaA}_${moedaB}`;

        let url = `https://free.currconv.com/api/v7/convert?apiKey=do-not-use-this-key&q=${de_para}&compact=y`;

        fetch(url)
            .then(result => result.json())
            .then(resp => {
                const cambialValue = resp[de_para].val;
                setConvertedValue(Number(cambialValue) * Number(convertValue));
                setOpenedBackdrop(false);

            })
    }


    return (
        <Container maxWidth="sm" fixed>
            <Grid alignContent="center">
                <Grid item xs={12}>
                    <Card raised>
                        <CardContent>
                            <Typography variant="h5" color="textPrimary" className="typography">
                                Currency converter:
                            </Typography>
                            <Grid container justify="flex-start" spacing={4} alignItems="center">
                                <Grid item xs={6}>
                                    <FormControl fullWidth>
                                        <Autocomplete
                                            id="lbl-from"
                                            options={currencies}
                                            getOptionLabel={(currency: Currencies) => currency.id}
                                            onChange={handleSetMoedaA}
                                            renderInput={(params) => <TextField {...params} label="From" margin="normal" />}
                                        />

                                    </FormControl>
                                </Grid>

                                <Grid item xs={6}>
                                    <FormControl fullWidth>
                                        <Autocomplete
                                            options={currencies}
                                            getOptionLabel={(currencie: Currencies) => currencie.id}
                                            id="lbl-to"
                                            clearOnEscape
                                            onChange={handleSetMoedaB}
                                            renderInput={params => <TextField {...params} label="To" margin="normal"></TextField>}
                                        />
                                    </FormControl>
                                </Grid>

                            </Grid>

                            <Grid container spacing={4} >
                                <Grid item xs={12}>
                                    <TextField label="Value to convert" fullWidth
                                        value={convertValue} onChange={handleConvertValue}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button variant="contained" color="secondary" fullWidth onClick={handleConvertButton}>
                                        Convert
                                    </Button>

                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="h6" color="textSecondary">
                                        Converted Value: {convertedValue.toFixed(4)}
                                    </Typography>
                                </Grid>
                            </Grid>


                        </CardContent>
                    </Card>

                    <Grid item xs={12}>
                        <TableContainer component={Card} className="TableContainer card">
                            <Typography variant="h6">
                                History Of Convertions
                            </Typography>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell>From</TableCell>
                                        <TableCell>To</TableCell>
                                        <TableCell>Value</TableCell>
                                        <TableCell>Converted</TableCell>
                                        <TableCell>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {historyOfConvertion.map(histoy => (
                                        <TableRow key={histoy.timestamp}>
                                            <TableCell>
                                                <Moment format="DD/MM/YYYY HH:mm">{histoy.timestamp}</Moment>
                                            </TableCell>
                                            <TableCell>{histoy.from}</TableCell>
                                            <TableCell>{histoy.to}</TableCell>
                                            <TableCell>{Number(histoy.value).toFixed(4)}</TableCell>
                                            <TableCell>{Number(histoy.result).toFixed(4)}</TableCell>
                                            <TableCell>
                                                <IconButton aria-label="delete" color="secondary" onClick={() => deleteHistory(histoy.timestamp)}>
                                                    <Delete />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                </TableBody>
                                <TableFooter>
                                    <TableRow>

                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            className="teste"
                            rowsPerPageOptions={[5, 10, 25]}
                            component="div"
                            count={totalRows}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onChangePage={handleChangePage}
                            onChangeRowsPerPage={handleChangeRowsPerPage}
                        />
                    </Grid>

                </Grid>
            </Grid>

            <Backdrop className={styles.backdrop} open={openedBackdrop}>
                <CircularProgress color="inherit" />
            </Backdrop>
        </Container>
    )
}

export default Conversor;