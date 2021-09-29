import React, { Component } from "react";
import { NFTStorage, File } from 'nft.storage';
// import DigitalArtContract from "./contracts/DigitalArt.json";
import TokenGenerator from "./contracts/TokenGenerator.json";
import getWeb3 from "./getWeb3";
// import ipfs from './ipfs'
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      web3: null,
      results: null,
      artwork: null,
      accounts: null,
      contract: null,
      tokenSymbol: '',
      tokenName: '',
      recipient: '',
      tokenDescription: '',
    };

    this.captureFile = this.captureFile.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.changeRecipient = this.changeRecipient.bind(this);
    this.changeTokenSymbol = this.changeTokenSymbol.bind(this);
    this.changeTokenName = this.changeTokenName.bind(this);
    this.changeTokenDescription = this.changeTokenDescription.bind(this);
  }

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();
      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      // const deployedNetwork = DigitalArtContract.networks[networkId];
      const deployedNetwork = TokenGenerator.networks[networkId];
      const instance = new web3.eth.Contract(
        // DigitalArtContract.abi,
        TokenGenerator.abi,
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
    this.setState({ artwork: event.target.files[0] })
  }

  // obtain the ipfs hash from the buffer created above
  onSubmit(event) {
    event.preventDefault()
    // create ipfs & metadata then pin the data on the nft.storage
    const tokenize = async () => {
      require('dotenv').config()
      const client = new NFTStorage({ token: process.env.REACT_APP_SECRET_APIKEY })
      const metadata = await client.store({
        name: this.state.tokenName,
        description: this.state.tokenDescription,
        image: new File([this.state.artwork], this.state.artwork.name, { type: this.state.artwork.type })
      })
      // call the smart contract method
      const { accounts, contract } = this.state;
      console.log('accounts:', accounts)
      console.log('contract:', contract)
      const result = await contract.methods.createToken(this.state.recipient, this.state.tokenDescription, this.state.tokenSymbol, metadata.url).send({ from: accounts[0] });

      console.log('result', result)
      // output metadata & artwork ipfs link
      console.log('Artwork  Link', `ipfs.io/ipfs/${metadata.data.image.pathname.slice(2)}`)
      console.log('Metadata Link', `ipfs.io/ipfs/${metadata.ipnft}/metadata.json`)
      console.log('Token Address', result.events.printAddress.returnValues.value)
      console.log('Token ID', result.events.printTokenID.returnValues.value)
      const links = {
        artwork_link: `ipfs.io/ipfs/${metadata.data.image.pathname.slice(2)}`,
        metadata_link: `ipfs.io/ipfs/${metadata.ipnft}/metadata.json`,
        token_address: result.events.printAddress.returnValues.value,
        token_ID: result.events.printTokenID.returnValues.value
      }
      this.setState({ results: links })
    };
    tokenize()
  }

  // updates the recipient's address
  changeRecipient(event) {
    event.preventDefault()
    this.setState({recipient: event.target.value});
    // console.log('Input Value', this.state.recipient)
  }

  // updates the token ID
  changeTokenSymbol(event) {
    event.preventDefault()
    this.setState({tokenSymbol: event.target.value});
    // console.log('Input Value', this.state.tokenSymbol)
  }

  // updates the token Name
  changeTokenName(event) {
    event.preventDefault()
    this.setState({tokenName: event.target.value});
    // console.log('Input Value', this.state.tokenName)
  }

  // updates the token description
  changeTokenDescription(event) {
    event.preventDefault()
    this.setState({tokenDescription: event.target.value});
    // console.log('Input Value', this.state.tokenDescription)
  }

  render() {
    let links = this.state.results;
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    const returnResults = () => {
      if (links == null) {
        return <label>You will find your NFT information here after the transaction.</label>;
      } else {
        return (
          <div>
            <label>Artowkr Link:</label>
            <input type='text' value={links.artwork_link} />
            <label>Metadata Link:</label>
            <input type='text' value={links.metadata_link} />
            <label>Token address:</label>
            <input type='text' value={links.token_address} />
            <label>Token ID:</label>
            <input type='text' value={links.token_ID} />
          </div>
        )}
    }

    return (
      <div className="App">
        <h1>Digital Artwork Minter</h1>
        <p>Convert your digital art work to a Non-fungible token!</p>
        <form onSubmit={this.onSubmit} >
          <input type='file' onChange={this.captureFile} />
          <div>
            <label>Recipient :</label>
            <input type='text' onChange={this.changeRecipient} />
            <label>Token Symbol :</label>
            <input type='text' onChange={this.changeTokenSymbol} />
            <label>Token Name :</label>
            <input type='text' onChange={this.changeTokenName} />
            <label>Token Description :</label>
            <input type='text' onChange={this.changeTokenDescription} />
          </div>
          <input type='submit'/>
        </form>
        <form>
          {returnResults()}
        </form>
      </div>
    );
  }
}

export default App;