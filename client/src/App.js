import React, { Component } from "react";
import SimpleStorageContract from "./contracts/SimpleStorage.json";
import getWeb3 from "./getWeb3";

import "./App.css";
import ipfs from './ipfs'

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      storageValue: "default value", 
      web3: null, 
      accounts: null, 
      contract: null,
      buffer: null,
      ipfsHash: ''
    };

    this.captureFile = this.captureFile.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();
      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = SimpleStorageContract.networks[networkId];
      const instance = new web3.eth.Contract(
        SimpleStorageContract.abi,
        deployedNetwork && deployedNetwork.address,
      );
      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  // conver file into buffer so ipfs-api can read it
  captureFile(event) {
    event.preventDefault()
    //get the first file
    const file = event.target.files[0]
    //get the file reader
    const reader = new window.FileReader()
    //convert file to array that buffer will understand
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) })
      console.log('buffer', this.state.buffer)
    }
  }

  // obtain the ipfs hash from the buffer created above
  onSubmit(event) {
    event.preventDefault()
    ipfs.files.add(this.state.buffer, (error, result) => {
      if(error) {
        console.error(error)
        return
      }
      this.setState({ ipfsHash: result[0].hash })
      console.log('IPFS Hash', this.state.ipfsHash)
      console.log(`https://ipfs.io/ipfs/${this.state.ipfsHash}`)
    })
    // define asynchronous contract method
    const tokenize = async () => {
      const { accounts, contract } = this.state;
      await contract.methods.mint(accounts[0], `https://ipfs.io/ipfs/${this.state.ipfsHash}`).send({ from: accounts[0] });
    };
    // call contract method
    tokenize()
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <h1>Your Image</h1>
        <p>This image is stored on IPFS & Ethereum Blockchain!</p>
        <img src={`https://ipfs.io/ipfs/${this.state.ipfsHash}`} alt=""/>
        <h2>Upload Image</h2>
        <form onSubmit={this.onSubmit} >
          <input type='file' onChange={this.captureFile} />
          <input type='submit' />
        </form>
        {/* <div>The stored value is: {this.state.storageValue}</div> */}
      </div>
    );
  }
}

export default App;

  // runExample = async () => {
  //   const { accounts, contract } = this.state;
  //   // Stores a given value, 5 by default.
  //   await contract.methods.set("IPFS Hash").send({ from: accounts[0] });
  //   // Get the value from the contract to prove it worked.
  //   const response = await contract.methods.get().call();
  //   // Update state with the result.
  //   this.setState({ storageValue: response });
  // };