import react,{useMemo} from 'react';

const PeerContext = react.createContext(null);

export const usePeer = () => {
    return react.useContext(PeerContext);
}

export const PeerProvider = (props) => {
    const peer = useMemo(()=>new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                ]
            }
        ]
    }),[]);
    const createOffer = async()=>{
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        return offer;
    }
    const createAnswer = async()=>{
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        return answer;
    }
    const setRemoteAnswer = async (answer) => {
    await peer.setRemoteDescription(new RTCSessionDescription(answer));
}

    return (
        <PeerContext.Provider value={{peer,createOffer,createAnswer, setRemoteAnswer}}>
            {props.children}
        </PeerContext.Provider>
    )
}