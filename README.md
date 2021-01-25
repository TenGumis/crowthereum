# Crowthereum

**Crowthereum** is a crowdfounding platform based on Ethereum smart contracts developed using Solidity.

## Expected functionalities

* Project owner should be able to publish a project description together with predefined mile-stones, their deadlines, and cost associated with each of them.
* Any user should be able to fund a chosen project as an ’investor’, the funds used for thatshould be locked inside the contract
* fter the milestone is reached and investors that have funded that particular project acceptit, the funds associated with that milestone should be transferred to the project owner.(significantly less than 100% of investors should be required to accept the milestone)
* In case a prespecified deadline is reached and a given milestone is not accepted, the fundsshould be returned to the investors.

## Preview
![](Crowthereum.gif)

## Installation

Setup environment.

* install **Node.js**

```bash
sudo apt install nodejs
``` 
* install **[Ganache](https://www.trufflesuite.com/ganache)** which mocks Ethereum blockchain locally. You can also use [ganache-cli](https://github.com/trufflesuite/ganache-cli) to do it from commandline.

* install **[MetaMask](https://metamask.io/download.html)** and set it up  (register one of Ganache's private keys in MetaMask).

* install **npm**

```bash
sudo apt install npm
```

* install **Truffle Framework**

```bash
# for now in version 5.0.2
sudo npm install -g truffle@5.0.2
```

* Install **Dependencies**

```bash
npm install
```

## How to run the project

* run Ganache and have MetaMask connected to Ganache's instance

* compile the project

```bash
truffle compile
```

* migrate the smart contract

```bash
truffle migrate
```

* run the front-end

```bash
npm run dev
```

## Known issues

* ```Error: EACCES: permission denied,[...]``` while running truffle compile or truffle migrate, a very quick, easy and possibly not-state-of-the-art workaround is to use ``` sudo truffle compile```. 


## License

[MIT](https://choosealicense.com/licenses/mit/)
