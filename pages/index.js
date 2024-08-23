import Head from 'next/head'
import React, { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css'
import axios from "axios";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import ConnectWalletButton from '../helpers/Aptos/ConnectWalletButton';
import QuantityToggle from '../helpers/QuantityToggle';
import {collectionCoverUrl, collectionBackgroundUrl, MaxMint, NODE_URL, CONTRACT_ADDRESS, COLLECTION_SIZE, SERVICE_NAME} from "../helpers/candyMachineInfo"

import Spinner from "react-bootstrap/Spinner";

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NETWORK_STR = Network.DEVNET; //refer to network here https://aptos-labs.github.io/aptos-ts-sdk/@aptos-labs/ts-sdk-1.19.0/enums/Network.html

const config = new AptosConfig({ network: NETWORK_STR }); 
const aptosClient = new Aptos(config);

//const aptosClient = new AptosClient(NODE_URL); //deprecated
const autoCmRefresh = 10000;

export default function Home() {
  const wallet = useWallet();
  const [voting, setVoting] = useState(false);
  const [canVote, setCanVote] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [minting, setMinting] = useState(false)
  const [currentSupply,setCurrentSupply] = useState();
  const [maxSupply,setMaxSupply] = useState();
  const [canMint, setCanMint] = useState(false)
  const [expireTime,setExpireTime] = useState();
  const [mintFee,setMintFee] = useState();
  const [isWhitelistOnly,setIsWhitelistOnly] = useState();
  const [collectionName,setColectionName] = useState();
  const [whiteList,setWhitelist] = useState([]);
  const [notificationActive, setNotificationActive] = useState(false);
  const [isWhitelist,setIsWhitelist] = useState(false);
  
  //to connect wallet
  useEffect(() => {

    if (!wallet.autoConnect && wallet.wallet?.adapter) {
        wallet.connect();
       
    }
  }, [wallet.autoConnect, wallet.wallet, wallet.connect]);
  
    // to disable if wallet is not connected
    useEffect(() => {
      setNotificationActive(false);

      setCanMint(true);
      setMinting(false);
      setIsWhitelist(false);
      getCandyMachineResourceData();
      if(wallet.connected){
        if(isWhitelistOnly){
          if(!whiteList.includes(account_address)){
            setIsWhitelist(false);
            toast.error("Unable to mint as your address is not in the whitelist.");
          }else{
            setIsWhitelist(true)
          }
        }
      }
    }, [wallet])

    const handleQuantityChange = (newQuantity) => {
      setQuantity(newQuantity);
    };
  

  //need when user click mint button and to wait for loading
  function timeout(delay) {
    return new Promise( res => setTimeout(res, delay) );
  }

  const account_address = wallet.account?.address?.toString();

  const vote = async () => {
    if (!wallet.account?.address) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      setVoting(true);
      const txHash = await wallet.signAndSubmitTransaction({
        sender: wallet.account.address,
        data: {
          function: `${CONTRACT_ADDRESS}::voting::vote`,
          typeArguments: [],
          functionArguments: [true], // Assuming 'true' for a positive vote
        },    
      });
      console.log("txHash ::", txHash.hash); 
      setVoting(false);
      toast.success(
        <div>
          <strong>Vote Submitted Successfully!</strong>
          <a href={`https://explorer.aptoslabs.com/txn/${txHash.hash}?network=${NETWORK_STR}`} target="_blank" rel="noopener noreferrer">
            <p>View Transaction</p>
          </a>
        </div>
      );
    } catch (err) {
      console.error(err);
      setVoting(false);
      toast.error("Error submitting vote: " + err.message);
    }
  }


  const mint = async () => {
    console.log("account_address ::"+account_address);
    if (account_address === undefined) {
      setNotificationActive(current => !current);
      await timeout(3000);
      setNotificationActive(current => !current);
      console.log("account_address undefined");
    }

    const quantitySpan = document.getElementById('quantityField');
    if (!quantitySpan) {
      console.error('Quantity span element not found');
      return;
    }

    const quantity = parseInt(quantitySpan.textContent, 10);
    if (isNaN(quantity)) {
      console.error('Invalid quantity value');
      return;
    }

    let txInfo;
    try {
        console.log("setMinting before");
        setMinting(true);
        console.log("setMinting after");
        const txHash = await wallet.signAndSubmitTransaction({
          sender: account_address,
          data: {
            function: `${CONTRACT_ADDRESS}::minting::mint_nft`,
            typeArguments: [],
            functionArguments: [quantity],
          },    
        });
        console.log("txHash ::", txHash.hash); 
          setMinting(false);
          getCandyMachineResourceData();
          toast.success(
            <div>
              <strong>Minting Success!</strong>
              <a href={`https://explorer.aptoslabs.com/txn/${txHash.hash}?network=${NETWORK_STR}`} target="_blank" rel="noopener noreferrer">
              <p>View Transaction</p>
              </a>
            </div>
          );
  
    } catch (err) {
      txInfo = {
        success: false,
        vm_status: err.message,
      }
      setMinting(false)
    }

  }

  async function getCandyMachineResourceData() {
    const response = await axios.get(`${NODE_URL}/accounts/${CONTRACT_ADDRESS}/resources`);
    console.log(response);
    const resources = response.data;
    console.log(response.data);

    for (const resource of resources) {
        if (resource.type === `${CONTRACT_ADDRESS}::minting::ModuleData`) {
            setExpireTime(resource.data.expiration_timestamp);
            setCurrentSupply(resource.data.current_supply);
            setMaxSupply(resource.data.maximum_supply);
            setColectionName(resource.data.collection_name);
            setWhitelist(resource.data.whitelist_addr);
            setIsWhitelistOnly(resource.data.whitelist_only);
            
            
            if(wallet.account?.publicKey?.toString() == resource.data.public_key.bytes){
              setCanMint(!canMint)
              console.log("this is admin")
            }
            if(resource.data.presale_status == false && resource.data.publicsale_status == false){
              setMinting(false);
              setCanMint(!canMint)
            }
            if(resource.data.presale_status && resource.data.publicsale_status){
              setMintFee(resource.data.public_price)
            }
            else if(resource.data.presale_status == true){
              setMintFee(resource.data.per_sale_price)
            }else{
              setMintFee(resource.data.public_price)
            }
        }
    }

}

//calculate time
function padTo2Digits(num) {
  return num.toString().padStart(2, '0');
}
function convertMsToTime(timestamp) {
    console.log("Timestamp ::"+timestamp);
    // Create a Date object from the Unix timestamp (multiply by 1000 to convert seconds to milliseconds)
    const date = new Date(timestamp * 1000);

    // Extract date components
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();
  
    // Extract time components
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
  
    // Determine AM/PM suffix
    const ampm = hours >= 12 ? 'PM' : 'AM';
  
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const formattedHours = String(hours).padStart(2, '0');
  
    // Construct the final formatted date and time string
    const formattedDate = `${day}/${month}/${year}`;
    const formattedTime = `${formattedHours}:${minutes}:${seconds} ${ampm}`;
  
    return `${formattedDate} ${formattedTime}`;  
}

  return (
    <div className="bg-gray-500">
      <div className={styles.container}>
        <Head>
          <title>Aptos-NFT-Dapp</title>
          <meta name="description" content="Aptos NFT Mint" />
          <link rel="icon" href="/favicon.ico" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
          <link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" crossOrigin="anonymous" />
        </Head>
        <img
          src={collectionBackgroundUrl}
          alt={'background'}
          className={styles.bg_image}
        />
        <div
          className={styles.bg_filter}
        ></div>
        <main className={styles.main}>
        <h1 className={styles.title}>
          Voting ActionX
        </h1>
        <div className={styles.topcorner}>
          <ConnectWalletButton connectButton={!wallet.connected} className="d-flex" />
        </div>
        
        <div id="voting-info" className="d-flex flex-column align-items-center text-white" style={{width: "80%"}}>
          <div className="d-flex align-items-center my-3">
            <button className={styles.button} onClick={vote}>
              {voting ? <Spinner animation="border" role="status"><span className="visually-hidden">Loading...</span></Spinner> : "Vote"}
            </button>
          </div>
        </div> 
      </main>

      </div>
      <ToastContainer />
    </div>
  )
}
