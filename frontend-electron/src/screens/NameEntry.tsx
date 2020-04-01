import React, { FC, useState, useEffect, useCallback, ChangeEvent, useMemo } from "react";
import styled from "styled-components"

const NameEntry: FC<{
    onSubmitName: (name: string) => void,
    className?: string,
}> = ({ onSubmitName, className }) => {
    const [userName, setUserName] = useState<string>("");
    const [roomName, setRoomName] = useState<string>("");
    const handleUserChange = useCallback((event: ChangeEvent<HTMLInputElement>) => setUserName(event.target.value), [])
    const handleSubmit = useCallback(() => {
        onSubmitName(userName);
    }, [userName]);
    return <div className={className}>
        <h1>Login</h1>
        <section>
            <p>
                <label>
                    What's your name?
                </label>
                <input value={userName} onChange={handleUserChange} />
            </p>
            <button disabled={!userName} onClick={handleSubmit}>Login</button>
        </section>
    </div>
}

export default styled(NameEntry)`
h1 {
    text-align: center;
}
background: #6699CC;
width: 100%;
flex-basis: 600px;
margin: 10px auto;
padding: 5px;
display: flex;
flex-direction: column;
> section {
  flex: 1;
  background: white;
  border: 2px solid grey;
  border-radius: 5px;
  margin: 5px;
  padding: 10px;
  button {
      display: block;
      margin: 10px auto;
      font-size: 18px;
      horizontal-align: right;
  }
  select {
      width: 100%;
      font-size: 24px;
  }
  p {
      margin: auto;
      width: 100%;
      overflow: auto;
      font-size: 24px;
      > label {
          float: left;
      }
      > input {
          line-height: 24px;
          font-size: 24px;
          float: right;
      }
  }
}
`;