import React, { Component } from "react";
import DigitalArtContract from "./contracts/DigitalArt.json";
import getWeb3 from "./getWeb3";
import ipfs from './ipfs'
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      web3: null, 
      accounts: null, 
      contract: null,
      buffer: null,
      ipfsHash: '',
      recipient: ''
    };

    this.captureFile = this.captureFile.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();
      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = DigitalArtContract.networks[networkId];
      const instance = new web3.eth.Contract(
        DigitalArtContract.abi,
        deployedNetwork && deployedNetwork.address,
      );
      // Set web3, accounts, and contract to the state
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
      console.log('Accounts[0]', this.state.accounts[0])
      console.log('Recipient Address', this.state.recipient)
    })
    // define asynchronous contract method
    const tokenize = async () => {
      const { accounts, contract } = this.state;
      await contract.methods.mint(this.state.recipient, `https://ipfs.io/ipfs/${this.state.ipfsHash}`).send({ from: accounts[0] });
    };
    // call contract method
    tokenize()
  }

  // updates the recipient's address
  handleChange(event) {
    event.preventDefault()
    this.setState({recipient: event.target.value});
    console.log('Input Value', this.state.recipient)
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <h1>Your Image</h1>
        <p>This image is stored on IPFS & Ethereum Blockchain!</p>
        <h2>Upload Image</h2>
        <form onSubmit={this.onSubmit} >
          <input type='file' onChange={this.captureFile} />
          <input type='text' onChange={this.handleChange} />
          <input type='submit' />
        </form>
        <img src={`https://ipfs.io/ipfs/${this.state.ipfsHash}`} alt=""/>
      </div>
    );
  }
}

export default App;