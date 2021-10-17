import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import wavePortal from './utils/WavePortal.json';

const App = () => {
  // A state variable we use to store our user's public wallet.
  const [currentAccount, setCurrentAccount] = useState("");

  // A variable to store total wave count
  let [waveCount, setCount] = useState(0);

  // All state property to store all waves
  const[allWaves, setAllWaves] = useState([]);

  // Form values
  const [dishValue, setDishValue] = useState("");
  const [recipeValue, setRecipeValue] = useState("");

  // Get random number to see if user won ether
  let [randomNumber, setRandomNumber] = useState(0);

  // Create a variable that holds the contract address after deployment
  const contractAddress = "0x010731E126A6b37a1a915edb79D5F2c333979AB1";

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
      waveCount = 0;
      randomNumber = 0;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, wavePortal.abi, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        const waveTxn = await wavePortalContract.wave(dishValue, recipeValue, {gasLimit:300000});
        console.log("Mining...", waveTxn.hash);
        alert("Mining...Please Wait.")
        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);
        alert("Added to the blockchain!")
        const ranNum = await wavePortalContract.getRandomNumber();
        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        setRandomNumber(randomNumber + ranNum.toNumber());
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
              dish: wave.dish,
              recipe: wave.recipe
            });
        });

        // Listen in for emitter events.
        wavePortalContract.on("NewWave", (from, timestamp, dish, recipe) => {
          console.log("NewWave", from, timestamp, dish, recipe);

          setAllWaves(prevState => [...prevState, {
            address: from,
            timestamp: new Date(timestamp * 1000),
            dish: dish,
            recipe: recipe
          }]);
        })

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
        Connect your wallet, send a wave, and save your favourite dishes on the blockchain for a 15% chance to win some ether! 
        You can paste a link or the whole recipe! What's your special tip to make the recipe delicious? <br></br>
        {waveCount>0?'Thank You! There are now '+waveCount+' recipes on this site.':null}
        <br></br>{(randomNumber>0 & randomNumber<15)?'Congratulations! You won 0.0015 ether!':null}</p>
        </div>

        {
          currentAccount ? (<textarea name='dish'
          placeholder="Name of the dish"
          type="text"
          id="dish"
          value={dishValue}
          onChange={e => setDishValue(e.target.value)}
          />) : null
        }
        {
          currentAccount ? (<textarea name='recipe'
          placeholder="The secret sauce"
          type="text"
          id="recipe"
          value={recipeValue}
          onChange={e => setRecipeValue(e.target.value)}
          />) : null
        }
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

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "coral", marginTop:"16px", padding: "8px", borderRadius: "4px"}}>
              <div>Dish: {wave.dish}</div>
              <div>Recipe: {wave.recipe}</div>
              <div>Sender: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
            </div>)
        })}
      </div>
    </div>
  );
}
export default App