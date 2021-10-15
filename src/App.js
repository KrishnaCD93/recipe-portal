import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import wavePortal from './utils/WavePortal.json'
import Form from './Form'

const App = () => {
  // A state variable we use to store our user's public wallet.
  const [currentAccount, setCurrentAccount] = useState("");

  // A variable to store total wave count
  let [waveCount, setCount] = useState(0);

  // All state property to store all waves
  const[allWaves, setAllWaves] = useState([]);

  // Create a variable that holds the contract address after deployment
  const contractAddress = "0x745b94839b8667e527738Ed9Ff726aDa7DE1DCdd";

  const checkIfWalletIsConnected = async () => {
    // Make sure we have access to window.ethereum
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      // Check if we're authorized to use the user's wallet
      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }
  // Implement a connectWallet method
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get metamask!");
        return;
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, wavePortal.abi, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        const waveTxn = await wavePortalContract.wave("Hello");
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        setCount(waveCount + count)
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  // Create a method that gets all waves from the contract
  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, wavePortal.abi, signer);

        // Call the function from smart contract
        const waves = await wavePortalContract.getAllWaves(); 

        // Only keep address, timestamp, and message in our UI.
        let wavesCleaned = [];
        waves.forEach(wave => {
            wavesCleaned.push({
              address: wave.waver,
              timestamp: new Date(wave.timestamp*1000),
              message: wave.message
            });
        });

        // Store the data in React State
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  // This runs our function when the page loads.
  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])
  useEffect(() => {
    getAllWaves();
  }, [])

  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        🧑‍🍳 Welcome to Recipe Portal!
        </div>

        <div className="bio">
        <p>I'm Krishna and I'm looking for new recipes!  <br></br>
        Connect your wallet, send a wave, and save your favourite recipes on the blockchain for a chance to win some ether! 
        You can paste a link or the whole recipe! <br></br>
        {waveCount>0?'There are now '+waveCount+' recipes on this site.':' '}</p>
        </div>

        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>

        {// If there is no current account render this button
        }
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        <Form />
        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop:"16px", padding: "8px"}}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}
      </div>
    </div>
  );
}
export default App