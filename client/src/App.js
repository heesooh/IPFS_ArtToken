import React, { Component } from "react";
// import DigitalArtContract from "./contracts/DigitalArt.json";
import TokenGenerator from "./contracts/TokenGenerator.json";
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
      imageBuffer: null,
      metadataBuffer: null,
      imageURI: '',
      metadataURI: '',
      recipient: '',
      tokenID: '',
      tokenName: '',
      tokenDescription: '',
      metadata: null
    };

    this.captureFile = this.captureFile.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.changeRecipient = this.changeRecipient.bind(this);
    this.changeTokenID = this.changeTokenID.bind(this);
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
    //get the first file
    const file = event.target.files[0]
    //get the file reader
    const reader = new window.FileReader()
    //convert file to array that buffer will understand
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => {
      this.setState({ imageBuffer: Buffer(reader.result) })
      console.log('Image Buffer', this.state.imageBuffer)
    }
  }

  // obtain the ipfs hash from the buffer created above
  onSubmit(event) {
    event.preventDefault()
    ipfs.files.add(this.state.imageBuffer, (error, result) => {
      if(error) {
        console.error(error)
        return
      }
      this.setState({ imageURI: `https://ipfs.io/ipfs/${result[0].hash}` })
      
      var metadataObj = {
        name: this.state.tokenName,
        description: this.state.tokenDescription,
        image: this.state.imageURI,
      };
      var metadataBuf = Buffer.from(JSON.stringify(metadataObj))

      this.setState({ metadata: metadataObj })
      this.setState({ metadataBuffer: metadataBuf})

      ipfs.files.add(this.state.metadataBuffer, (error, result) => {
        if(error) {
          console.error(error)
          return
        }
        this.setState({ metadataURI: `https://ipfs.io/ipfs/${result[0].hash}` })
        console.log(this.state.metadataURI)

        const tokenize = async () => {
          const { accounts, contract } = this.state;
          const tokenAddress = await contract.methods.createToken(this.state.recipient, this.state.tokenDescription, this.state.tokenID, this.state.metadataURI).send({ from: accounts[0] });
          console.log(tokenAddress)
        };
        tokenize()
      })
    })
  }

  // updates the recipient's address
  changeRecipient(event) {
    event.preventDefault()
    this.setState({recipient: event.target.value});
    console.log('Input Value', this.state.recipient)
  }

  // updates the token ID
  changeTokenID(event) {
    event.preventDefault()
    this.setState({tokenID: event.target.value});
    console.log('Input Value', this.state.tokenID)
  }

  // updates the token Name
  changeTokenName(event) {
    event.preventDefault()
    this.setState({tokenName: event.target.value});
    console.log('Input Value', this.state.tokenName)
  }

  // updates the token description
  changeTokenDescription(event) {
    event.preventDefault()
    this.setState({tokenDescription: event.target.value});
    console.log('Input Value', this.state.tokenDescription)
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
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
            <label>Token ID :</label>
            <input type='text' onChange={this.changeTokenID} />
            <label>Token Name :</label>
            <input type='text' onChange={this.changeTokenName} />
            <label>Token Description :</label>
            <input type='text' onChange={this.changeTokenDescription} />
          </div>
          <input type='submit'/>
        </form>
        <img src={this.state.imageURI} alt=""/>
      </div>
    );
  }
}

export default App;