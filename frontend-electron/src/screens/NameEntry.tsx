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
        <section>
            <h1>Welcome to Zeitgeist</h1>
            <h3>Enjoy the presence of others with your own virtual room</h3>
        </section>
        <section className="form">
            <div className="formFields">
                <label>What's your name?</label>
                <input value={userName} onChange={handleUserChange} />
            </div>
            <button disabled={!userName} onClick={handleSubmit}>Get started</button>
        </section>
    </div>
}

export default styled(NameEntry)`
h1 {
    text-align: left;
    color: white;
    font-size: 36px;
}
h3 {
    color: rgba(173,198,255);
    font-size: 18px;
}
width: 100%;
justify-content: center;
align-items: center;
display: flex;
flex-direction: column;
> section {
    width: 50%;
    margin: 15px 0px;
}
> .form {
  button {
      display: block;
      font-size: 14px;
      color: rgba(249, 224, 189);
      background: transparent;
      border: 1px solid;
      border-color: rgba(249, 224, 189);
      border-radius: 4px;
      padding: 10px 15px;
      margin: 15px 0px;
      cursor: pointer;
  }
  button: hover {
      background: rgba(249, 224, 189);
      color: rgba(80, 124, 248);
  }
  button: disabled {
    background: transparent;
    color: rgba(249, 224, 189);
  }
  select {
      width: 100%;
      font-size: 24px;
  }
  label {
      display: block;
      color: white;
  }
  input {
    outline: 0;
    border-width: 0 0 2px;
    border-color: white;
    background: transparent;
    font-size: 14px;
    margin: 10px 0px 0px 0px;
    display: block;
    color: white;
    width: 200px;
  }
  input:focus {
    border-color: rgba(249, 224, 189);
  }
  .formFields {
    margin: 25px 0px;
  }
}
`;